import type { AnimationContext } from '@rbook/animation'
import { createSnapshotPlayer, type SnapshotPlayer } from '@rbook/animation'
import { EDGES, NODES, buildFrames, easeInOut, isTreeEdge, lerp, runTarjan, type SccFrame } from './scc-model'

/**
 * 六帧：
 *   1. 原始有向图：参考图的网格布局，全直线、无虚线、节点中性不上色
 *   2. 变成 DFS 树：点与边平滑移动过去，抵达后非树边才变淡虚线
 *   3. 标出 dfn：每个点旁出现 dfn 小字
 *   4~6. 按 Tarjan 出栈顺序，一个分量一个分量地被包围圆高亮
 *
 * 位移用 RAF 插值：progress 从 0（图布局）到 1（树布局）。
 * 打断时从当前插值位置继续走，不回跳。
 */

const RADIUS = 22
const MORPH_MS = 650

const INK = '#172033'
const MUTED = '#576782'
const IDLE_FILL = '#ffffff'
const IDLE_STROKE = '#94a3b8'
const EDGE_STROKE = '#222222'
const NON_TREE_STROKE = '#bbbbbb'
/** dfn 小字颜色：比正文淡一档。 */
const DFN_INK = '#7c8aa0'
/**
 * dfn 小字的摆位。默认正下方；下方有出边或被别的边穿过的点要换边，
 * 否则小字会压在线上。坐标改动后需要重看，tests 里有位置断言。
 */
const DFN_SIDE: Readonly<Record<number, 'below' | 'above' | 'left' | 'right'>> = {
    1: 'right',  // 1 正下方是 4->1 的返祖边与 dfn 区
    3: 'left',   // 3 正下方是 3->4 的树边
    2: 'right',  // 2 正下方是 2->4 的横叉边
    4: 'right',  // 4 正下方是 4->6 的树边
    5: 'below',
    6: 'below',
}

/** 分量配色：三个分量三个色相，浅底 + 深边，与正文墨色区分。 */
const COMPONENT_STYLE = [
    { fill: '#d8e6f7', stroke: '#2f5fa8' }, // 分量①（最先出栈）
    { fill: '#dcefe1', stroke: '#2f7a4f' }, // 分量②
    { fill: '#f4e2c8', stroke: '#96631d' }, // 分量③
] as const

const STYLES = `
:host { display: block; color: ${INK}; }
* { box-sizing: border-box; }
.scc-anim {
    background: #fff;
    border: 1px solid #d6d6d6;
    margin: 26px 0;
    padding: 16px 18px 14px;
}
.scc-anim canvas {
    display: block;
    height: 480px;
    max-width: 100%;
    width: 100%;
}
.scc-anim__title {
    font-size: 15px;
    font-weight: 600;
    margin: 2px 0 4px;
}
.scc-anim__message {
    color: ${MUTED};
    font-size: 13px;
    line-height: 1.6;
    margin: 8px 0 0;
    min-height: 42px;
}
.scc-anim__legend {
    color: ${MUTED};
    display: flex;
    flex-wrap: wrap;
    font-size: 12px;
    gap: 6px 18px;
    margin: 6px 0 0;
}
.scc-anim__legend span { align-items: center; display: inline-flex; gap: 6px; }
.scc-anim__swatch { border: 1.5px solid; display: inline-block; height: 12px; width: 12px; }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'scc-anim'
    shell.innerHTML = `
      <p class="scc-anim__title" aria-live="polite"></p>
      <canvas aria-label="Tarjan 强连通分量动画"></canvas>
      <p class="scc-anim__message" aria-live="polite"></p>
      <p class="scc-anim__legend"></p>
      <div class="scc-anim__player"></div>
    `
    context.root.append(style, shell)

    const canvas = shell.querySelector('canvas')!
    const titleElement = shell.querySelector<HTMLElement>('.scc-anim__title')!
    const message = shell.querySelector<HTMLElement>('.scc-anim__message')!
    const legend = shell.querySelector<HTMLElement>('.scc-anim__legend')!
    const playerRoot = shell.querySelector<HTMLElement>('.scc-anim__player')!

    const result = runTarjan()
    // 图例只在第三幕出现：第一幕就列出分量和颜色，等于提前泄露答案。
    const legendItems = result.components.map((component, index) => {
        const item = document.createElement('span')
        const swatch = document.createElement('i')
        swatch.className = 'scc-anim__swatch'
        swatch.style.borderColor = COMPONENT_STYLE[index].stroke
        swatch.style.background = COMPONENT_STYLE[index].fill
        const root = result.roots[index]
        item.append(swatch, document.createTextNode(
            `分量 ${index + 1}：{${component.join(',')}}，根 ${root}（第 ${index + 1} 个出栈）`,
        ))
        return item
    })

    const steps = buildFrames(result)

    /** 0 = 图布局，1 = 树布局。位移插值进度。 */
    let progress = 0
    let frame = 0
    let activeStep: SccFrame = steps[0]

    const paint = () => draw(canvas, activeStep, result, progress)

    /**
     * 平滑移动到目标布局。中断时从当前 progress 继续，
     * 所以连点「下一步」不会先跳回起点。
     */
    const animateTo = (target: number) => {
        if (frame !== 0) {
            cancelAnimationFrame(frame)
            frame = 0
        }
        if (Math.abs(target - progress) < 1e-6) {
            progress = target
            paint()
            return
        }
        const from = progress
        const startedAt = performance.now()
        const tick = (now: number) => {
            const t = Math.min(1, (now - startedAt) / MORPH_MS)
            progress = lerp(from, target, easeInOut(t))
            paint()
            if (t < 1) {
                frame = requestAnimationFrame(tick)
            } else {
                progress = target
                frame = 0
                paint()
            }
        }
        frame = requestAnimationFrame(tick)
    }

    const render = (step: SccFrame) => {
        activeStep = step
        titleElement.textContent = step.title
        message.textContent = step.message
        legend.replaceChildren(...legendItems.slice(0, step.revealed))
        animateTo(step.treeLayout ? 1 : 0)
    }

    const player: SnapshotPlayer<SccFrame> = createSnapshotPlayer({
        root: playerRoot,
        steps,
        render,
        intervalMs: 1800,
    })

    const observer = new ResizeObserver(() => paint())
    observer.observe(canvas)

    context.onCleanup(() => {
        observer.disconnect()
        if (frame !== 0) cancelAnimationFrame(frame)
    })
    context.onCleanup(() => player.destroy())
}

function draw(
    canvas: HTMLCanvasElement,
    step: SccFrame,
    result: ReturnType<typeof runTarjan>,
    progress: number,
): void {
    const width = Math.max(360, Math.floor(canvas.clientWidth))
    const height = Math.max(320, Math.floor(canvas.clientHeight))
    const ratio = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // 图形区逻辑尺寸固定，整体居中并等比缩放，避免窄屏溢出。
    const logicalWidth = 560
    const logicalHeight = 470
    const scale = Math.min(width / logicalWidth, height / logicalHeight, 1.15)
    const offsetX = (width - logicalWidth * scale) / 2
    const offsetY = (height - logicalHeight * scale) / 2
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    // 两套坐标按 progress 线性插值：点移动的同时，边跟着重新连。
    const posOf = (id: number) => {
        const node = NODES.find(n => n.id === id)!
        return { x: lerp(node.x, node.tx, progress), y: lerp(node.y, node.ty, progress) }
    }
    const atTree = progress > 0.999

    // 第三幕的包围圆画在最底层，节点和边压在上面。
    if (step.revealed > 0) {
        for (let index = 0; index < step.revealed; index++) {
            const points = result.components[index].map(posOf)
            const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length
            const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length
            const reach = Math.max(...points.map(p => Math.hypot(p.x - cx, p.y - cy)))
            // 外圈明显大于节点圆，避免单点分量出现三层同心圆挤在一起。
            const radius = reach + RADIUS + 30

            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fillStyle = COMPONENT_STYLE[index].fill
            ctx.globalAlpha = 0.5
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.strokeStyle = COMPONENT_STYLE[index].stroke
            ctx.lineWidth = 1.4
            ctx.stroke()
        }
    }

    // 边一律直线。抵达树布局后，非树边才变淡虚线；移动途中保持实线。
    for (const edge of EDGES) {
        const tree = isTreeEdge(edge, result.treeEdges)
        const faded = atTree && !tree
        const from = posOf(edge.from)
        const to = posOf(edge.to)
        const both = offsetEndpoints(from, to, RADIUS)

        ctx.save()
        ctx.setLineDash(faded ? [5, 4] : [])
        ctx.strokeStyle = faded ? NON_TREE_STROKE : EDGE_STROKE
        ctx.lineWidth = faded ? 1.2 : 1.6
        ctx.beginPath()
        ctx.moveTo(both.x1, both.y1)
        ctx.lineTo(both.x2, both.y2)
        ctx.stroke()
        ctx.restore()

        const angle = Math.atan2(both.y2 - both.y1, both.x2 - both.x1)
        drawArrowHead(ctx, both.x2, both.y2, angle, faded ? NON_TREE_STROKE : EDGE_STROKE)
    }

    // 节点：第三幕只给已揭晓的分量上色，其余保持中性。
    for (const node of NODES) {
        const point = posOf(node.id)
        const componentIndex = result.color[node.id]
        const revealed = step.revealed > 0 && componentIndex < step.revealed
        const style = revealed ? COMPONENT_STYLE[componentIndex] : undefined

        ctx.beginPath()
        ctx.arc(point.x, point.y, RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = style ? style.fill : IDLE_FILL
        ctx.strokeStyle = style ? style.stroke : IDLE_STROKE
        ctx.lineWidth = style ? 2 : 1.5
        ctx.fill()
        ctx.stroke()

        // 分量的根画双圈，与文章插图一致。
        if (revealed && result.roots[componentIndex] === node.id) {
            ctx.beginPath()
            ctx.arc(point.x, point.y, RADIUS - 4, 0, Math.PI * 2)
            ctx.strokeStyle = style!.stroke
            ctx.lineWidth = 1
            ctx.stroke()
        }

        ctx.fillStyle = INK
        ctx.font = '700 15px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(node.id), point.x, point.y + 0.5)

        // dfn 小字：第三幕起出现。默认画在节点正下方，
        // 但下方有出边时会被线穿过，所以按点逐个避开（见 DFN_SIDE）。
        if (step.showDfn) {
            const side = DFN_SIDE[node.id] ?? 'below'
            let x = point.x
            let y = point.y + RADIUS + 4
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            if (side === 'above') {
                y = point.y - RADIUS - 4
                ctx.textBaseline = 'bottom'
            } else if (side === 'left') {
                x = point.x - RADIUS - 6
                y = point.y
                ctx.textAlign = 'right'
                ctx.textBaseline = 'middle'
            } else if (side === 'right') {
                x = point.x + RADIUS + 6
                y = point.y
                ctx.textAlign = 'left'
                ctx.textBaseline = 'middle'
            }
            ctx.fillStyle = DFN_INK
            ctx.font = '11px system-ui, sans-serif'
            ctx.fillText(`dfn ${result.dfn[node.id]}`, x, y)
        }
    }

    ctx.restore()
}

/** 把边的两端各向里收 r，避免线段扎进节点圆里。 */
function offsetEndpoints(
    from: { x: number; y: number },
    to: { x: number; y: number },
    r: number,
): { x1: number; y1: number; x2: number; y2: number } {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy) || 1
    const ux = dx / length
    const uy = dy / length
    return { x1: from.x + ux * r, y1: from.y + uy * r, x2: to.x - ux * r, y2: to.y - uy * r }
}

function drawArrowHead(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    color: string,
): void {
    const size = 8
    const spread = 0.42
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.4
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - Math.cos(angle - spread) * size, y - Math.sin(angle - spread) * size)
    ctx.moveTo(x, y)
    ctx.lineTo(x - Math.cos(angle + spread) * size, y - Math.sin(angle + spread) * size)
    ctx.stroke()
    ctx.restore()
}
