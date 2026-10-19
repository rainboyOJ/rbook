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
    { from: 1, to: 2, w: 5 },
    { from: 1, to: 3, w: 2 },
    { from: 3, to: 2, w: -4 },
    { from: 2, to: 4, w: 2 },
]

interface SpfaStep {
    readonly queue: readonly number[]
    readonly inQueue: readonly boolean[]
    readonly dis: readonly number[]
    readonly activeNode?: number
    readonly activeEdge?: { readonly from: number, readonly to: number }
    readonly message: string
}

const STYLES = `
:host { color: #172033; display: block; font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
.spfa-anim { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; margin: 16px 0; }
.spfa-anim canvas { display: block; height: 260px; max-width: 100%; width: 100%; }
.spfa-anim__message { color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0 0; min-height: 44px; }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'spfa-anim'
    shell.innerHTML = `
      <canvas aria-label="SPFA 最短路算法动态演示"></canvas>
      <p class="spfa-anim__message" aria-live="polite"></p>
      <div class="spfa-anim__player"></div>
    `
    context.root.append(style, shell)

    const canvas = shell.querySelector('canvas')!
    const message = shell.querySelector<HTMLElement>('.spfa-anim__message')!
    const playerRoot = shell.querySelector<HTMLElement>('.spfa-anim__player')!

    const steps = buildSteps()
    let currentStep = steps[0]

    const render = (step: SpfaStep) => {
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

function buildSteps(): readonly SpfaStep[] {
    const steps: SpfaStep[] = []
    const INF = 999
    const dis = [0, 0, INF, INF, INF]
    const inQueue = [false, true, false, false, false]
    const queue = [1]

    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        message: '初始化：源点 1 的 dis[1] = 0 并入队，其余点 dis = ∞。',
    })

    // Step 1: Pop 1
    queue.shift()
    inQueue[1] = false
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 1,
        message: '点 1 出队（in_queue[1] = false），开始松弛点 1 的所有出边。',
    })

    // 1 -> 2 (5)
    dis[2] = 5
    inQueue[2] = true
    queue.push(2)
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 1,
        activeEdge: { from: 1, to: 2 },
        message: '松弛边 1 -> 2 (权值 5)：dis[2] 减小为 5，点 2 入队。',
    })

    // 1 -> 3 (2)
    dis[3] = 2
    inQueue[3] = true
    queue.push(3)
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 1,
        activeEdge: { from: 1, to: 3 },
        message: '松弛边 1 -> 3 (权值 2)：dis[3] 减小为 2，点 3 入队。',
    })

    // Step 2: Pop 2
    queue.shift()
    inQueue[2] = false
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 2,
        message: '点 2 出队，开始尝试松弛点 2 的出边。',
    })

    // 2 -> 4 (2)
    dis[4] = 7
    inQueue[4] = true
    queue.push(4)
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 2,
        activeEdge: { from: 2, to: 4 },
        message: '松弛边 2 -> 4 (权值 2)：dis[4] = 5 + 2 = 7，点 4 入队。',
    })

    // Step 3: Pop 3
    queue.shift()
    inQueue[3] = false
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 3,
        message: '点 3 出队，开始松弛出边 3 -> 2 (负权 -4)。',
    })

    // 3 -> 2 (-4)
    dis[2] = -2
    inQueue[2] = true
    queue.push(2)
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 3,
        activeEdge: { from: 3, to: 2 },
        message: '【核心演示】松弛 3 -> 2：dis[3] + (-4) = 2 - 4 = -2 < 5！点 2 距离变小，重新入队！',
    })

    // Step 4: Pop 4
    queue.shift()
    inQueue[4] = false
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 4,
        message: '点 4 出队，无出边，直接结束本轮。',
    })

    // Step 5: Pop 2 (again)
    queue.shift()
    inQueue[2] = false
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 2,
        message: '点 2 再次出队，用新的最优距离 (-2) 重新通知邻居！',
    })

    // 2 -> 4 (2 again)
    dis[4] = 0
    inQueue[4] = true
    queue.push(4)
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 2,
        activeEdge: { from: 2, to: 4 },
        message: '松弛 2 -> 4：-2 + 2 = 0 < 7！点 4 距离更新为 0 并重新入队。',
    })

    // Step 6: Pop 4 (again)
    queue.shift()
    inQueue[4] = false
    steps.push({
        queue: [...queue],
        inQueue: [...inQueue],
        dis: [...dis],
        activeNode: 4,
        message: '点 4 再次出队，无出边。队列变空，算法运行结束！最终 dis: [0, -2, 2, 0]。',
    })

    return Object.freeze(steps)
}

function draw(canvas: HTMLCanvasElement, step: SpfaStep): void {
    const width = Math.max(320, Math.floor(canvas.clientWidth))
    const height = Math.max(220, Math.floor(canvas.clientHeight))
    const scale = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.clearRect(0, 0, width, height)

    // Draw Status Bar at top
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.fillStyle = '#0f172a'
    ctx.textAlign = 'left'
    const queueStr = step.queue.length ? `[ ${step.queue.join(', ')} ]` : '空 []'
    ctx.fillText(`待通知队列: ${queueStr}`, 16, 26)

    ctx.fillStyle = '#475569'
    const disStr = step.dis.slice(1).map((d, i) => `点${i + 1}:${d >= 900 ? '∞' : d}`).join('  ')
    ctx.fillText(`当前最短距离:  ${disStr}`, 16, 48)

    // Layout adjustment
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
        const isInQ = step.inQueue[n.id]
        const isCurrent = step.activeNode === n.id

        ctx.beginPath()
        ctx.arc(x, y, 20, 0, Math.PI * 2)

        if (isCurrent) {
            ctx.fillStyle = '#fef08a'
            ctx.strokeStyle = '#ca8a04'
            ctx.lineWidth = 2.5
        } else if (isInQ) {
            ctx.fillStyle = '#bae6fd'
            ctx.strokeStyle = '#0284c7'
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

        // Subtitle: dis & queue status
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillStyle = isInQ ? '#0369a1' : '#64748b'
        const label = `d=${d >= 900 ? '∞' : d}${isInQ ? ' (在队)' : ''}`
        ctx.fillText(label, x, y + 36)
    }
}
