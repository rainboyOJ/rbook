import { createSnapshotPlayer, type AnimationContext, type SnapshotPlayer } from '@rbook/animation'

interface NodePos {
    readonly id: number
    readonly x: number
    readonly y: number
}

const NODES: readonly NodePos[] = [
    { id: 1, x: 70, y: 110 },
    { id: 2, x: 230, y: 55 },
    { id: 3, x: 230, y: 165 },
    { id: 4, x: 390, y: 110 },
]

interface Edge {
    readonly from: number
    readonly to: number
    readonly w: number
}

const EDGES: readonly Edge[] = [
    { from: 1, to: 2, w: 1 },
    { from: 1, to: 3, w: 2 },
    { from: 2, to: 3, w: 2 },
    { from: 3, to: 4, w: 2 },
    { from: 2, to: 4, w: 4 },
]

interface SecondDijkstraStep {
    readonly heap: readonly { readonly d: number, readonly u: number }[]
    readonly dis1: readonly number[]
    readonly dis2: readonly number[]
    readonly activeNode?: number
    readonly activeEdge?: { readonly from: number, readonly to: number }
    readonly message: string
}

const STYLES = `
:host { color: #172033; display: block; font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
.second-dijkstra-anim { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; margin: 16px 0; }
.second-dijkstra-anim canvas { display: block; height: 270px; max-width: 100%; width: 100%; }
.second-dijkstra-anim__message { color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0 0; min-height: 48px; }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'second-dijkstra-anim'
    shell.innerHTML = `
      <canvas aria-label="Dijkstra 次短路算法动态演示"></canvas>
      <p class="second-dijkstra-anim__message" aria-live="polite"></p>
      <div class="second-dijkstra-anim__player"></div>
    `
    context.root.append(style, shell)

    const canvas = shell.querySelector('canvas')!
    const message = shell.querySelector<HTMLElement>('.second-dijkstra-anim__message')!
    const playerRoot = shell.querySelector<HTMLElement>('.second-dijkstra-anim__player')!

    const steps = buildSteps()
    let currentStep = steps[0]

    const render = (step: SecondDijkstraStep) => {
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

function buildSteps(): readonly SecondDijkstraStep[] {
    const steps: SecondDijkstraStep[] = []
    const INF = 999
    const dis1 = [0, 0, INF, INF, INF]
    const dis2 = [0, INF, INF, INF, INF]
    const heap = [{ d: 0, u: 1 }]

    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        message: '初始化：源点 1 的最短路 dis1[1] = 0，其余点 dis1/dis2 均为 ∞。小根堆压入 (0, 1)。',
    })

    // Step 1: Pop (0, 1)
    heap.shift()
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 1,
        message: '弹出堆顶 (0, 1)，开始松弛源点 1 的所有出边。',
    })

    // 1 -> 2 (1)
    dis1[2] = 1
    heap.push({ d: 1, u: 2 })
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 1,
        activeEdge: { from: 1, to: 2 },
        message: '松弛边 1 -> 2 (权值 1)：更新 dis1[2] = 1，将 (1, 2) 压入堆。',
    })

    // 1 -> 3 (2)
    dis1[3] = 2
    heap.push({ d: 2, u: 3 })
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 1,
        activeEdge: { from: 1, to: 3 },
        message: '松弛边 1 -> 3 (权值 2)：更新 dis1[3] = 2，将 (2, 3) 压入堆。当前堆: [(1, 2), (2, 3)]。',
    })

    // Step 2: Pop (1, 2)
    heap.sort((a, b) => a.d - b.d)
    heap.shift()
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 2,
        message: '弹出堆顶 (1, 2) (这是点 2 的最短路 1)。开始松弛出边 2 -> 3 与 2 -> 4。',
    })

    // 2 -> 3 (2): nd = 1 + 2 = 3. dis1[3] = 2. nd > dis1[3] and nd < dis2[3]=∞!
    dis2[3] = 3
    heap.push({ d: 3, u: 3 })
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 2,
        activeEdge: { from: 2, to: 3 },
        message: '【核心情况2】考察 2 -> 3：nd = 1 + 2 = 3 > dis1[3]=2，但 3 < dis2[3]=∞！成功更新点 3 的次短路 dis2[3] = 3，将 (3, 3) 压入堆。',
    })

    // 2 -> 4 (4): nd = 1 + 4 = 5. dis1[4] = 5.
    dis1[4] = 5
    heap.push({ d: 5, u: 4 })
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 2,
        activeEdge: { from: 2, to: 4 },
        message: '考察 2 -> 4：nd = 1 + 4 = 5 < dis1[4]=∞，更新点 4 的最短路 dis1[4] = 5，将 (5, 4) 压入堆。',
    })

    // Step 3: Pop (2, 3)
    heap.sort((a, b) => a.d - b.d)
    heap.shift()
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 3,
        message: '弹出堆顶 (2, 3) (这是点 3 的最短路 2)。松弛出边 3 -> 4 (权值 2)。',
    })

    // 3 -> 4 (2): nd = 2 + 2 = 4. dis1[4] = 5. nd < dis1[4]!
    // dis2[4] becomes 5, dis1[4] becomes 4!
    dis2[4] = 5
    dis1[4] = 4
    heap.push({ d: 5, u: 4 })
    heap.push({ d: 4, u: 4 })
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 3,
        activeEdge: { from: 3, to: 4 },
        message: '【核心情况1】考察 3 -> 4：nd = 2 + 2 = 4 < dis1[4]=5！原最短路降级为次短路 dis2[4] = 5，新最短路 dis1[4] = 4！',
    })

    // Step 4: Pop (3, 3)
    heap.sort((a, b) => a.d - b.d)
    heap.shift()
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 3,
        message: '弹出堆顶 (3, 3) (这是点 3 的次短路 3)。松弛出边 3 -> 4 (权值 2)：nd = 3 + 2 = 5 == dis2[4]，无法严格改善次短路，忽略。',
    })

    // Step 5: Pop (4, 4) & (5, 4)
    heap.sort((a, b) => a.d - b.d)
    heap.shift()
    steps.push({
        heap: [...heap],
        dis1: [...dis1],
        dis2: [...dis2],
        activeNode: 4,
        message: '弹出堆顶 (4, 4) (这是终点 4 的最短路 4)。无出边。',
    })

    steps.push({
        heap: [],
        dis1: [...dis1],
        dis2: [...dis2],
        message: '堆中弹出 (5, 4) 确认终点 4 的严格次短路为 5！算法结束。最终求得终点 4：最短路 = 4 (路径 1->3->4)，严格次短路 = 5 (路径 1->2->4)。',
    })

    return Object.freeze(steps)
}

function draw(canvas: HTMLCanvasElement, step: SecondDijkstraStep): void {
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
    ctx.fillText(`优先队列 (堆): ${heapStr}`, 16, 24)

    ctx.fillStyle = '#1e3a8a'
    const dis1Str = step.dis1.slice(1).map((d, i) => `${i + 1}:${d >= 900 ? '∞' : d}`).join('  ')
    ctx.fillText(`最短路 dis1:  ${dis1Str}`, 16, 44)

    ctx.fillStyle = '#b45309'
    const dis2Str = step.dis2.slice(1).map((d, i) => `${i + 1}:${d >= 900 ? '∞' : d}`).join('  ')
    ctx.fillText(`次短路 dis2:  ${dis2Str}`, 16, 64)

    // Layout
    const offsetX = (width - 460) / 2
    const offsetY = 25

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
        const d1 = step.dis1[n.id]
        const d2 = step.dis2[n.id]
        const isCurrent = step.activeNode === n.id

        ctx.beginPath()
        ctx.arc(x, y, 20, 0, Math.PI * 2)

        if (isCurrent) {
            ctx.fillStyle = '#fef08a'
            ctx.strokeStyle = '#ca8a04'
            ctx.lineWidth = 2.5
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

        // Subtitle: dis1 / dis2
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillStyle = '#0284c7'
        const label1 = `最短:${d1 >= 900 ? '∞' : d1}`
        ctx.fillText(label1, x, y + 35)

        ctx.fillStyle = '#d97706'
        const label2 = `次短:${d2 >= 900 ? '∞' : d2}`
        ctx.fillText(label2, x, y + 49)
    }
}
