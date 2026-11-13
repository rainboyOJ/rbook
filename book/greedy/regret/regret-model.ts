export interface Task { id: string; duration: number; deadline: number }
export interface Frame {
    kind: 'start' | 'add' | 'keep' | 'remove' | 'done'
    current: string | null
    selected: string[]
    removed: string[]
    heap: string[]
    total: number
    deadline: number | null
    discarded: string | null
    title: string
    message: string
}
// Sorted by deadline. B replaces A; the later E is discarded immediately.
export const TASKS: readonly Task[] = [
    { id: 'A', duration: 6, deadline: 7 },
    { id: 'B', duration: 3, deadline: 8 },
    { id: 'C', duration: 4, deadline: 9 },
    { id: 'D', duration: 2, deadline: 10 },
    { id: 'E', duration: 9, deadline: 11 },
]
export function buildFrames(input: readonly Task[] = TASKS): Frame[] {
    const tasks = [...input].sort((a, b) => a.deadline - b.deadline)
    const heap: Task[] = [], removed: string[] = [], frames: Frame[] = []
    let total = 0
    function push(task: Task) {
        heap.push(task)
        let i = heap.length - 1
        while (i > 0) {
            const parent = (i - 1) >> 1
            if (heap[parent].duration >= heap[i].duration) break
            ;[heap[parent], heap[i]] = [heap[i], heap[parent]]
            i = parent
        }
    }
    function pop(): Task {
        const top = heap[0], last = heap.pop()!
        if (heap.length) {
            heap[0] = last
            let i = 0
            while (true) {
                let largest = i
                for (const child of [i * 2 + 1, i * 2 + 2]) {
                    if (child < heap.length && heap[child].duration > heap[largest].duration) largest = child
                }
                if (largest === i) break
                ;[heap[i], heap[largest]] = [heap[largest], heap[i]]
                i = largest
            }
        }
        return top
    }
    function record(kind: Frame['kind'], task: Task | null, title: string, message: string, discarded: string | null = null) {
        const ids = new Set(heap.map(t => t.id))
        frames.push({ kind, current: task?.id ?? null, selected: tasks.filter(t => ids.has(t.id)).map(t => t.id),
            heap: heap.map(t => t.id), removed: [...removed], total, deadline: task?.deadline ?? null,
            discarded, title, message })
    }
    record('start', null, '按截止时间从小到大扫描', '还没有选任务。上排是扫描顺序，下排是大根堆的层序数组。')
    for (const task of tasks) {
        push(task); total += task.duration
        record('add', task, `尝试加入 ${task.id}`, `总耗时 ${total}，当前截止时间 ${task.deadline}。${total > task.deadline ? '已经超时：下一步需要反悔；本帧不是合法方案。' : '没有超时，下一步确认保留。'}`)
        if (total > task.deadline) {
            const worst = pop(); total -= worst.duration; removed.push(worst.id)
            record('remove', task, `撤销 ${worst.id}`, `弹出耗时最长的 ${worst.id}（${worst.duration}）。总耗时恢复为 ${total} ≤ ${task.deadline}。${worst.id === task.id ? '这次撤销的是刚加入的任务。' : '这次撤销的是以前的选择。'}`, worst.id)
        } else {
            record('keep', task, `保留 ${task.id}`, `总耗时 ${total} ≤ ${task.deadline}，当前候选方案可行。`)
        }
    }
    record('done', null, `最终保留 ${heap.length} 个任务`, `按截止时间执行 ${frames.at(-1)!.selected.join('、')}，总耗时 ${total}。堆的排列只为快速找最大值，不是执行顺序。`)
    return frames
}
