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
    { from: 1, to: 2, w: 4 },
    { from: 1, to: 3, w: 5 },
    { from: 2, to: 4, w: 3 },
    { from: 3, to: 2, w: -2 },
]

interface BellmanStep {
    readonly round: number
    readonly dis: readonly number[]
    readonly activeEdge?: { readonly from: number, readonly to: number }
    readonly message: string
}

const STYLES = `
:host { color: #172033; display: block; font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
.bellman-anim { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; margin: 16px 0; }
.bellman-anim canvas { display: block; height: 260px; max-width: 100%; width: 100%; }
.bellman-anim__message { color: #334155; font-size: 14px; line-height: 1.5; margin: 8px 0 0; min-height: 44px; }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'bellman-anim'
    shell.innerHTML = `
      <canvas aria-label="Bellman-Ford 最短路算法动态演示"></canvas>
      <p class="bellman-anim__message" aria-live="polite"></p>
      <div class="bellman-anim__player"></div>
    `
    context.root.append(style, shell)

    const canvas = shell.querySelector('canvas')!
    const message = shell.querySelector<HTMLElement>('.bellman-anim__message')!
    const playerRoot = shell.querySelector<HTMLElement>('.bellman-anim__player')!

    const steps = buildSteps()
    let currentStep = steps[0]

    const render = (step: BellmanStep) => {
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

function buildSteps(): readonly BellmanStep[] {
    const steps: BellmanStep[] = []
    const INF = 999
    const dis = [0, 0, INF, INF, INF]

    steps.push({
        round: 0,
        dis: [...dis],
        message: '【初始状态 (Round 0)】源点 1 的 dis[1] = 0，其余点 dis = ∞。保证经过最多 0 条边的最短路。',
    })

    // Round 1
    // 1 -> 2 (4)
    dis[2] = 4
    steps.push({
        round: 1,
        dis: [...dis],
        activeEdge: { from: 1, to: 2 },
        message: '【第 1 轮松弛】考察边 1 -> 2 (权值 4)：0 + 4 < ∞，dis[2] 更新为 4。',
    })

    // 1 -> 3 (5)
    dis[3] = 5
    steps.push({
        round: 1,
        dis: [...dis],
        activeEdge: { from: 1, to: 3 },
        message: '【第 1 轮松弛】考察边 1 -> 3 (权值 5)：0 + 5 < ∞，dis[3] 更新为 5。',
    })

    // 2 -> 4 (3)
    dis[4] = 7
    steps.push({
        round: 1,
        dis: [...dis],
        activeEdge: { from: 2, to: 4 },
        message: '【第 1 轮松弛】考察边 2 -> 4 (权值 3)：4 + 3 = 7 < ∞，dis[4] 更新为 7。',
    })

    // 3 -> 2 (-2)
    dis[2] = 3
    steps.push({
        round: 1,
        dis: [...dis],
        activeEdge: { from: 3, to: 2 },
        message: '【第 1 轮松弛】考察边 3 -> 2 (权值 -2)：5 + (-2) = 3 < 4，dis[2] 进一步更新为 3！第 1 轮结束。',
    })

    // Round 2
    steps.push({
        round: 2,
        dis: [...dis],
        message: '【第 2 轮松弛开始】再次遍历所有边，传播经过 2 条边以上的最短路。',
    })

    // 2 -> 4 (3) again
    dis[4] = 6
    steps.push({
        round: 2,
        dis: [...dis],
        activeEdge: { from: 2, to: 4 },
        message: '【第 2 轮松弛】考察边 2 -> 4 (权值 3)：因 dis[2] 已降至 3，3 + 3 = 6 < 7！dis[4] 更新为 6。',
    })

    // Round 3
    steps.push({
        round: 3,
        dis: [...dis],
        message: '【第 3 轮松弛】本轮再次扫描所有边，未发生任何更新！说明所有简单最短路已全部达到最优，提前收敛退出。',
    })

    return Object.freeze(steps)
}

function draw(canvas: HTMLCanvasElement, step: BellmanStep): void {
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
    ctx.fillText(`松弛轮次: Round ${step.round} / (n - 1)`, 16, 26)

    ctx.fillStyle = '#475569'
    const disStr = step.dis.slice(1).map((d, i) => `点${i + 1}:${d >= 900 ? '∞' : d}`).join('  ')
    ctx.fillText(`最短距离:  ${disStr}`, 16, 48)

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

        ctx.beginPath()
        ctx.arc(x, y, 20, 0, Math.PI * 2)
        ctx.fillStyle = '#f8fafc'
        ctx.strokeStyle = '#64748b'
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()

        // Node ID
        ctx.font = '700 14px system-ui, sans-serif'
        ctx.fillStyle = '#0f172a'
        ctx.textAlign = 'center'
        ctx.fillText(String(n.id), x, y + 5)

        // Subtitle: dis
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillStyle = '#475569'
        const label = `d=${d >= 900 ? '∞' : d}`
        ctx.fillText(label, x, y + 36)
    }
}
