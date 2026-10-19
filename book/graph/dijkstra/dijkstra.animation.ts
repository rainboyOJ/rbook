import { createSnapshotPlayer, type AnimationContext, type SnapshotPlayer } from '@rbook/animation'

interface NodePos {
    readonly id: number
    readonly x: number
    readonly y: number
}

const NODES: readonly NodePos[] = [
    { id: 1, x: 70, y: 110 },
    { id: 2, x: 230, y: 60 },
    { id: 3, x: 230, y: 160 },
    { id: 4, x: 390, y: 110 },
]

interface Edge {
    readonly from: number
    readonly to: number
    readonly w: number
}

const EDGES: readonly Edge[] = [
    { from: 1, to: 2, w: 8 },
    { from: 1, to: 3, w: 2 },
    { from: 3, to: 2, w: 1 },
    { from: 2, to: 4, w: 2 },
    { from: 3, to: 4, w: 7 },
]

interface HeapItem {
    readonly d: number
    readonly u: number
    readonly expired?: boolean
}

interface DijkstraStep {
    readonly heap: readonly HeapItem[]
    readonly determined: readonly boolean[]
    readonly dis: readonly number[]
    readonly activeNode?: number
    readonly activeEdge?: { readonly from: number, readonly to: number }
    readonly message: string
}

const STYLES = `
:host { color: #172033; display: block; font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
.dijkstra-anim { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; margin: 16px 0; }
.dijkstra-anim canvas { display: block; height: 260px; max-width: 100%; width: 100%; }
.dijkstra-anim__message { color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0 0; min-height: 44px; }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'dijkstra-anim'
    shell.innerHTML = `
      <canvas aria-label="Dijkstra 最短路算法动态演示"></canvas>
      <p class="dijkstra-anim__message" aria-live="polite"></p>
      <div class="dijkstra-anim__player"></div>
    `
    context.root.append(style, shell)

    const canvas = shell.querySelector('canvas')!
    const message = shell.querySelector<HTMLElement>('.dijkstra-anim__message')!
    const playerRoot = shell.querySelector<HTMLElement>('.dijkstra-anim__player')!

    const steps = buildSteps()
    let currentStep = steps[0]

    const render = (step: DijkstraStep) => {
        currentStep = step
        message.textContent = step.message
        draw(canvas, step)
    }

    const player = createSnapshotPlayer({
        root: playerRoot,
        steps,
        render,
    })

    const resizeObserver = new ResizeObserver(() => {
        if (currentStep) draw(canvas, currentStep)
    })
    resizeObserver.observe(canvas)

    context.onCleanup(() => resizeObserver.disconnect())
    context.onCleanup(() => player.destroy())
}

function buildSteps(): readonly DijkstraStep[] {
    const steps: DijkstraStep[] = []
    const INF = 999
    const dis = [0, 0, INF, INF, INF]
    const determined = [false, false, false, false, false]
    const heap: HeapItem[] = [{ d: 0, u: 1 }]

    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        message: '初始化：源点 1 的 dis[1] = 0 并压入小根堆 (0, 1)，其余点 dis = ∞。',
    })

    // Step 1: Pop 1
    heap.shift()
    determined[1] = true
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 1,
        message: '小根堆弹出最小元素 (0, 1)：确定点 1 的最终最短路为 0。开始松弛出边。',
    })

    // Relax 1 -> 2 (8)
    dis[2] = 8
    heap.push({ d: 8, u: 2 })
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 1,
        activeEdge: { from: 1, to: 2 },
        message: '松弛边 1 -> 2 (权值 8)：dis[2] 更新为 8，将 (8, 2) 压入堆。',
    })

    // Relax 1 -> 3 (2)
    dis[3] = 2
    heap.push({ d: 2, u: 3 })
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 1,
        activeEdge: { from: 1, to: 3 },
        message: '松弛边 1 -> 3 (权值 2)：dis[3] 更新为 2，将 (2, 3) 压入堆。堆顶为当前最小 (2, 3)。',
    })

    // Step 2: Pop 3
    heap.sort((a, b) => a.d - b.d)
    const top3 = heap.shift()!
    determined[3] = true
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 3,
        message: '【贪心选择】弹出堆顶最小者 (2, 3)：确定点 3 的最终最短路为 2！开始松弛其出边。',
    })

    // Relax 3 -> 2 (1)
    dis[2] = 3
    heap.push({ d: 3, u: 2 })
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 3,
        activeEdge: { from: 3, to: 2 },
        message: '松弛 3 -> 2 (权值 1)：2 + 1 = 3 < 8！dis[2] 更新为 3，新记录 (3, 2) 压入堆。注意：原来的 (8, 2) 仍在堆中但已过期！',
    })

    // Relax 3 -> 4 (7)
    dis[4] = 9
    heap.push({ d: 9, u: 4 })
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 3,
        activeEdge: { from: 3, to: 4 },
        message: '松弛 3 -> 4 (权值 7)：2 + 7 = 9，将 (9, 4) 压入堆。',
    })

    // Step 3: Pop 2 (d=3)
    heap.sort((a, b) => a.d - b.d)
    heap.shift()
    determined[2] = true
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 2,
        message: '弹出堆顶最小者 (3, 2)：确定点 2 的最终最短路为 3！开始松弛其出边。',
    })

    // Relax 2 -> 4 (2)
    dis[4] = 5
    heap.push({ d: 5, u: 4 })
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 2,
        activeEdge: { from: 2, to: 4 },
        message: '松弛 2 -> 4 (权值 2)：3 + 2 = 5 < 9！dis[4] 更新为 5，将 (5, 4) 压入堆。',
    })

    // Step 4: Pop 4 (d=5)
    heap.sort((a, b) => a.d - b.d)
    heap.shift()
    determined[4] = true
    steps.push({
        heap: [...heap],
        determined: [...determined],
        dis: [...dis],
        activeNode: 4,
        message: '弹出堆顶最小者 (5, 4)：确定点 4 的最终最短路为 5！点 4 无出边。',
    })

    // Step 5: Skip expired
    steps.push({
        heap: [],
        determined: [...determined],
        dis: [...dis],
        message: '【过期跳过】随后堆中剩余的 (8, 2) 和 (9, 4) 相继弹出，因 du > dis[u] 被判定为过期记录直接跳过！算法圆满结束。',
    })

    return Object.freeze(steps)
}

function draw(canvas: HTMLCanvasElement, step: DijkstraStep): void {
    const width = Math.max(320, Math.floor(canvas.clientWidth))
    const height = Math.max(220, Math.floor(canvas.clientHeight))
    const scale = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.clearRect(0, 0, width, height)

    // Draw Status Bar
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'left'
    const heapStr = step.heap.length
        ? `[ ${step.heap.map(h => `(${h.d}, ${h.u})`).join(', ')} ]`
        : '空 []'
    ctx.fillText(`小根堆状态: ${heapStr}`, 16, 26)

    ctx.fillStyle = '#475569'
    const disStr = step.dis.slice(1).map((d, i) => `点${i + 1}:${d >= 900 ? '∞' : d}${step.determined[i + 1] ? '✓' : ''}`).join('  ')
    ctx.fillText(`最短距离 (✓已确定):  ${disStr}`, 16, 48)

    // Layout
    const offsetX = (width - 460) / 2
    const offsetY = 20

    // Draw Edges
    for (const e of EDGES) {
        const u = NODES.find(n => n.id === e.from)!
        const v = NODES.find(n => n.id === e.to)!
        const x1 = u.x + offsetX
        const y1 = u.y + offsetY
        const x2 = v.x + offsetX
        const y2 = v.y + offsetY

        const isActive = step.activeEdge && step.activeEdge.from === e.from && step.activeEdge.to === e.to

        ctx.strokeStyle = isActive ? '#ef4444' : '#94a3b8'
        ctx.lineWidth = isActive ? 2.5 : 1.5

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Edge Weight label
        const midX = (x1 + x2) / 2
        const midY = (x1 + x2) / 2 === y1 ? y1 - 10 : (y1 + y2) / 2 - 8
        ctx.font = '600 12px system-ui, sans-serif'
        ctx.fillStyle = isActive ? '#b91c1c' : '#334155'
        ctx.textAlign = 'center'
        ctx.fillText(String(e.w), midX, midY)
    }

    // Draw Nodes
    for (const n of NODES) {
        const x = n.x + offsetX
        const y = n.y + offsetY
        const d = step.dis[n.id]
        const isDet = step.determined[n.id]
        const isCurrent = step.activeNode === n.id

        ctx.beginPath()
        ctx.arc(x, y, 20, 0, Math.PI * 2)

        if (isCurrent) {
            ctx.fillStyle = '#fef08a'
            ctx.strokeStyle = '#ca8a04'
            ctx.lineWidth = 2.5
        } else if (isDet) {
            ctx.fillStyle = '#dcfce7'
            ctx.strokeStyle = '#16a34a'
            ctx.lineWidth = 2
        } else {
            ctx.fillStyle = '#f8fafc'
            ctx.strokeStyle = '#64748b'
            ctx.lineWidth = 1.5
        }
        ctx.fill()
        ctx.stroke()

        // Node ID
        ctx.font = '700 14px system-ui, sans-serif'
        ctx.fillStyle = '#0f172a'
        ctx.textAlign = 'center'
        ctx.fillText(String(n.id), x, y + 5)

        // Subtitle: dis
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillStyle = isDet ? '#15803d' : '#64748b'
        const label = `d=${d >= 900 ? '∞' : d}${isDet ? ' (已定)' : ''}`
        ctx.fillText(label, x, y + 36)
    }
}
