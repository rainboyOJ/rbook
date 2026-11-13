import type { AnimationContext } from '@rbook/animation'
import { createSnapshotPlayer } from '@rbook/animation'
import { createQueue, createShell } from '../search-animation'
import { EDGES, zeroOneFrames } from './zero-one-model'

// Fixed four-node teaching figure. Algorithm and queue states come from the model.
const GRAPH = `<svg class="graph" viewBox="0 0 600 190" role="img" aria-label="1到2、2到3、3到4权值为0，1到3和1到4权值为1">
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1 9 5 0 9" fill="var(--muted)"/></marker><marker id="active-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1 9 5 0 9" fill="var(--accent)"/></marker></defs>
<g class="edge" data-edge="0"><path d="M71 139 L188 107" marker-end="url(#arrow)"/><text x="125" y="112">0</text></g>
<g class="edge paid" data-edge="1"><path d="M65 130 Q210 -5 355 86" marker-end="url(#arrow)"/><text x="210" y="45">1</text></g>
<g class="edge paid" data-edge="2"><path d="M73 145 L527 145" marker-end="url(#arrow)"/><text x="300" y="168">1</text></g>
<g class="edge" data-edge="3"><path d="M233 100 L347 100" marker-end="url(#arrow)"/><text x="290" y="89">0</text></g>
<g class="edge" data-edge="4"><path d="M392 106 L528 139" marker-end="url(#arrow)"/><text x="462" y="112">0</text></g>
<g class="vertex" data-v="1"><circle cx="50" cy="145" r="22"/><text x="50" y="145">1/S</text></g>
<g class="vertex" data-v="2"><circle cx="210" cy="100" r="22"/><text x="210" y="100">2</text></g>
<g class="vertex" data-v="3"><circle cx="370" cy="100" r="22"/><text x="370" y="100">3</text></g>
<g class="vertex" data-v="4"><circle cx="550" cy="145" r="22"/><text x="550" y="145">4/T</text></g></svg>`

export function mount(context: AnimationContext): void {
    const { shell, query } = createShell(context, '0-1 BFS：让更便宜的路线排到前面', '队列条目写作“顶点@入队距离”。× 表示距离已改进，该旧条目尚待出队跳过。')
    query('.visual').innerHTML = GRAPH + '<div class="distances" aria-label="当前最短距离估计"></div>'
    const labels = Array.from({ length: 4 }, (_, i) => {
        const cell = document.createElement('div'); cell.className = 'distance'; cell.dataset.v = String(i + 1)
        query('.distances').append(cell); return cell
    })
    query('.legend').textContent = '实线 / 0：免费 · 虚线 / 1：付费 · 绿色描边：距离已确定 · 加粗边：本步成功松弛'
    const frames = zeroOneFrames()
    const paintQueue = createQueue(query('.queue'), Math.max(...frames.map(f => f.queue.length)))
    const player = createSnapshotPlayer({ root: query('.player'), steps: frames, intervalMs: 1000, render(frame) {
        labels.forEach((label, i) => {
            const d = frame.distances[i + 1]
            label.textContent = `${i + 1}: ${Number.isFinite(d) ? d : '∞'}`
            label.className = `distance${frame.edge !== null && EDGES[frame.edge].to === i + 1 ? ' active' : ''}`
        })
        shell.querySelectorAll<SVGGElement>('.vertex').forEach(node => {
            const v = Number(node.dataset.v)
            node.setAttribute('class', `vertex${frame.settled.includes(v) ? ' settled' : ''}${frame.current === v ? ' current' : ''}`)
        })
        shell.querySelectorAll<SVGGElement>('.edge').forEach(edge => {
            const index = Number(edge.dataset.edge), active = index === frame.edge
            edge.setAttribute('class', `edge${EDGES[index].weight ? ' paid' : ''}${active ? ' active' : ''}`)
            edge.querySelector('path')!.setAttribute('marker-end', active ? 'url(#active-arrow)' : 'url(#arrow)')
        })
        paintQueue(frame.queue.map(e => ({ text: `${e.distance !== frame.distances[e.vertex] ? '× ' : ''}${e.vertex}@${e.distance}`, stale: e.distance !== frame.distances[e.vertex] })))
        query('.message').textContent = frame.message
        shell.dataset.kind = frame.kind
        shell.dataset.current = frame.current === null ? '' : String(frame.current)
    } })
    context.onCleanup(() => player.destroy())
}
