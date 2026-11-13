export const GRID = ['00010', '01010', '00000', '01110', '00000'] as const
export interface BfsFrame {
    kind: 'start' | 'expand' | 'done'
    current: number | null
    distances: number[]
    queue: number[]
    fresh: number[]
    path: number[]
    message: string
}
export function bfsFrames(grid: readonly string[] = GRID, source = 0, target = grid.length * grid[0].length - 1): BfsFrame[] {
    const rows = grid.length, cols = grid[0].length
    const distances = Array(rows * cols).fill(-1) as number[]
    const parent = Array(rows * cols).fill(-1) as number[]
    const queue: number[] = [source], frames: BfsFrame[] = []
    let head = 0
    distances[source] = 0
    const name = (v: number) => `(${Math.floor(v / cols) + 1},${v % cols + 1})`
    const record = (kind: BfsFrame['kind'], current: number | null, fresh: number[], path: number[], message: string) => {
        frames.push({ kind, current, distances: [...distances], queue: queue.slice(head), fresh: [...fresh], path: [...path], message })
    }
    record('start', null, [source], [], `起点 ${name(source)} 的距离设为 0，并立即入队。`)
    while (head < queue.length) {
        const u = queue[head++], x = Math.floor(u / cols), y = u % cols
        const fresh: number[] = []
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = x + dx, ny = y + dy, v = nx * cols + ny
            if (nx < 0 || nx >= rows || ny < 0 || ny >= cols || grid[nx][ny] === '1' || distances[v] !== -1) continue
            distances[v] = distances[u] + 1; parent[v] = u; queue.push(v); fresh.push(v)
        }
        record('expand', u, fresh, [], `弹出 ${name(u)}，扩展第 ${distances[u]} 层。${fresh.length ? `新发现 ${fresh.map(name).join('、')}，在入队时将距离确定为 ${distances[u] + 1}。` : '没有尚未发现的可通行邻居。'}`)
    }
    const path: number[] = []
    if (distances[target] !== -1) for (let v = target; v !== -1; v = parent[v]) path.push(v)
    path.reverse()
    record('done', null, [], path, path.length ? `终点最短距离为 ${distances[target]}。标有 ★ 的格子给出一条最短路径；每次沿 parent 回退，距离减少 1。` : '终点不可达，距离保持 -1。')
    return frames
}
