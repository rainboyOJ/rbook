import type { AnimationContext } from '@rbook/animation'
import { createSnapshotPlayer } from '@rbook/animation'
import { createQueue, createShell } from '../search-animation'
import { bfsFrames, GRID } from './bfs-model'

export function mount(context: AnimationContext): void {
    const { shell, query } = createShell(context, 'BFS：按层扩展迷宫', 'S 是起点，T 是终点。距离在入队时就确定；队列列出“坐标:距离”。')
    const board = document.createElement('div'); board.className = 'maze'; board.setAttribute('aria-label', '五行五列迷宫距离图')
    const cells = GRID.flatMap((row, x) => [...row].map((wall, y) => {
        const cell = document.createElement('div'); cell.className = 'cell'
        cell.innerHTML = '<small></small><b></b>'
        cell.dataset.index = String(x * row.length + y)
        cell.dataset.wall = wall
        board.append(cell); return cell
    }))
    query('.visual').append(board)
    query('.legend').textContent = '# 障碍 · → 正在扩展 · + 本步新发现 · ★ 一条最短路径'
    const frames = bfsFrames(), cols = GRID[0].length
    const paintQueue = createQueue(query('.queue'), Math.max(...frames.map(f => f.queue.length)))
    const player = createSnapshotPlayer({ root: query('.player'), steps: frames, intervalMs: 1000, render(frame) {
        cells.forEach((cell, i) => {
            const wall = cell.dataset.wall === '1', path = frame.path.includes(i), fresh = frame.fresh.includes(i)
            cell.className = `cell${wall ? ' wall' : ''}${frame.distances[i] >= 0 ? ' visited' : ''}${fresh ? ' fresh' : ''}${frame.current === i ? ' current' : ''}${path ? ' path' : ''}`
            cell.querySelector('small')!.textContent = i === 0 ? 'S' : i === cells.length - 1 ? 'T' : frame.current === i ? '→' : path ? '★' : fresh ? '+' : ''
            cell.querySelector('b')!.textContent = wall ? '#' : frame.distances[i] < 0 ? '—' : String(frame.distances[i])
        })
        paintQueue(frame.queue.map(v => ({ text: `(${Math.floor(v / cols) + 1},${v % cols + 1}):${frame.distances[v]}` })))
        query('.message').textContent = frame.message
        shell.dataset.kind = frame.kind
        shell.dataset.current = frame.current === null ? '' : String(frame.current)
    } })
    context.onCleanup(() => player.destroy())
}
