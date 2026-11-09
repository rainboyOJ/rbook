import type { AnimationContext } from '@rbook/animation'
import { createSnapshotPlayer, type SnapshotPlayer } from '@rbook/animation'
import { SPEC, runGrouped, runGroupedWrongOrder, type Frame, type GroupedSpec } from './grouped-knapsack-model'

/**
 * 分组背包的一维数组原地更新演示。
 *
 * 读者要看到的是：**只有一行 f[]**，容量 J 从大到小走，
 * 每到一个 J 就把组内所有物品试一遍，试完再挪到 J-1。
 *
 * 画面分三块：
 *   上：三组物品，当前组高亮，组内物品逐个标出本帧的试探结果
 *   中：一维数组 f[0..C]，本帧改动的格子闪一下
 *   下：一句话说明这一帧发生了什么
 */

const INK = '#172033'
const MUTED = '#576782'
const LINE = '#cbd5e1'

const CELL_FILL = '#ffffff'
const CELL_STROKE = '#94a3b8'
const CELL_ACTIVE = '#dbeafe'      // 当前 J
const CELL_ACTIVE_STROKE = '#2563eb'
const CELL_CHANGED = '#fde68a'     // 本帧被改大
const CELL_CHANGED_STROKE = '#d97706'
const CELL_SOURCE = '#e0f2e9'      // 被读取的来源格
const CELL_SOURCE_STROKE = '#2f7a4f'

/** 每一组一个色相，用来区分「这一帧在处理哪一组」。 */
const GROUP_STYLE = [
    { fill: '#dbeafe', stroke: '#2563eb', text: '#1e40af' },
    { fill: '#dcefe1', stroke: '#2f7a4f', text: '#1f5c3a' },
    { fill: '#f4e2c8', stroke: '#96631d', text: '#7a4f13' },
] as const

const STYLES = `
:host { display: block; color: ${INK}; }
* { box-sizing: border-box; }
.gkb {
    background: #fff;
    border: 1px solid #d6d6d6;
    margin: 26px 0;
    padding: 16px 18px 14px;
}
.gkb canvas { display: block; height: 230px; max-width: 100%; width: 100%; }
.gkb__title { font-size: 15px; font-weight: 600; margin: 2px 0 4px; }
.gkb__message {
    color: ${MUTED}; font-size: 13px; line-height: 1.6;
    margin: 8px 0 0; min-height: 40px;
}
.gkb__legend {
    color: ${MUTED}; display: flex; flex-wrap: wrap;
    font-size: 12px; gap: 6px 16px; margin: 6px 0 0;
}
.gkb__legend span { align-items: center; display: inline-flex; gap: 5px; }
.gkb__swatch { border: 1.5px solid; display: inline-block; height: 11px; width: 11px; }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'gkb'
    shell.innerHTML = `
      <p class="gkb__title" aria-live="polite"></p>
      <canvas aria-label="分组背包一维数组演示"></canvas>
      <p class="gkb__message" aria-live="polite"></p>
      <p class="gkb__legend">
        <span><i class="gkb__swatch" style="background:${CELL_ACTIVE};border-color:${CELL_ACTIVE_STROKE}"></i>当前 J</span>
        <span><i class="gkb__swatch" style="background:${CELL_CHANGED};border-color:${CELL_CHANGED_STROKE}"></i>本帧被更新</span>
        <span><i class="gkb__swatch" style="background:${CELL_SOURCE};border-color:${CELL_SOURCE_STROKE}"></i>被读取的来源</span>
      </p>
      <div class="gkb__player"></div>
    `
    context.root.append(style, shell)

    const canvas = shell.querySelector('canvas')!
    const titleElement = shell.querySelector<HTMLElement>('.gkb__title')!
    const message = shell.querySelector<HTMLElement>('.gkb__message')!
    const playerRoot = shell.querySelector<HTMLElement>('.gkb__player')!

    const result = runGrouped(SPEC)
    const wrongAnswer = runGroupedWrongOrder(SPEC)
    // 最后一帧把「若容量正序会怎样」摆出来，正序是最常见的写错方式
    const frames: readonly Frame[] = [
        ...result.frames,
        {
            kind: 'done',
            groupIndex: SPEC.groups.length - 1,
            capacity: SPEC.capacity,
            trials: [],
            snapshot: result.frames[result.frames.length - 1].snapshot,
            changed: false,
            title: '对照：容量若写成正序',
            message: `正序（J 从 0 到 ${SPEC.capacity}）会让同一组的物品被反复选中，` +
                `算出 ${wrongAnswer}，而正确答案是 ${result.answer}。这就是容量必须倒序的原因。`,
        },
    ]

    let current: Frame = frames[0]
    const paint = () => draw(canvas, current, SPEC)

    const render = (frame: Frame) => {
        current = frame
        titleElement.textContent = frame.title
        message.textContent = frame.message
        paint()
    }

    const player: SnapshotPlayer<Frame> = createSnapshotPlayer({
        root: playerRoot,
        steps: frames,
        render,
        intervalMs: 1200,
    })

    const observer = new ResizeObserver(() => paint())
    observer.observe(canvas)
    context.onCleanup(() => observer.disconnect())
    context.onCleanup(() => player.destroy())
}

function draw(canvas: HTMLCanvasElement, frame: Frame, spec: GroupedSpec): void {
    const width = Math.max(360, Math.floor(canvas.clientWidth))
    const height = Math.max(320, Math.floor(canvas.clientHeight))
    const ratio = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // 逻辑画布固定，整体等比缩放居中
    const LW = 620
    const LH = 230
    const scale = Math.min(width / LW, height / LH, 1.2)
    const ox = (width - LW * scale) / 2
    const oy = (height - LH * scale) / 2
    ctx.save()
    ctx.translate(ox, oy)
    ctx.scale(scale, scale)

    drawGroups(ctx, frame, spec)
    drawArray(ctx, frame, spec)
    drawPointer(ctx, frame, spec)

    ctx.restore()
}

/** 上半部分：三组物品，当前组高亮，组内物品标出本帧试探结果。 */
function drawGroups(ctx: CanvasRenderingContext2D, frame: Frame, spec: GroupedSpec): void {
    const top = 8
    const boxH = 74
    const gap = 10
    const boxW = (620 - gap * (spec.groups.length - 1)) / spec.groups.length

    spec.groups.forEach((group, gi) => {
        const x = gi * (boxW + gap)
        const active = gi === frame.groupIndex
        const style = GROUP_STYLE[gi % GROUP_STYLE.length]

        // 组的外框
        ctx.beginPath()
        roundRect(ctx, x, top, boxW, boxH, 8)
        ctx.fillStyle = active ? style.fill : '#f8fafc'
        ctx.fill()
        ctx.strokeStyle = active ? style.stroke : LINE
        ctx.lineWidth = active ? 2 : 1
        ctx.stroke()

        // 组名
        ctx.fillStyle = active ? style.text : MUTED
        ctx.font = active ? '700 13px system-ui, sans-serif' : '13px system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(`第 ${gi + 1} 组`, x + 10, top + 8)

        // 组内物品：本帧有试探时，显示「w=?, v=?」与结果
        const perRow = Math.min(group.length, 3)
        const itemW = (boxW - 20) / Math.max(perRow, 1)
        group.forEach(([w, v], ii) => {
            const ix = x + 10 + ii * itemW
            const iy = top + 30
            const trial = frame.trials.find(t => t.itemIndex === ii)

            let label = `w${w} v${v}`
            let mark = ''
            let tone = MUTED
            if (active && trial) {
                if (trial.skipped) { mark = '✕'; tone = '#b0b7c3' }
                else if (trial.improved) { mark = `→${trial.candidate}`; tone = CELL_CHANGED_STROKE }
                else { mark = '–'; tone = '#8a94a6' }
            }

            ctx.fillStyle = tone
            ctx.font = active ? '12px system-ui, sans-serif' : '11px system-ui, sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(label, ix, iy)
            if (mark) {
                ctx.font = '700 12px system-ui, sans-serif'
                ctx.fillStyle = tone
                ctx.fillText(mark, ix, iy + 16)
            }
        })
    })
}

/** 中间：一维数组 f[0..C]。 */
function drawArray(ctx: CanvasRenderingContext2D, frame: Frame, spec: GroupedSpec): void {
    const cap = spec.capacity
    const cellW = 54
    const cellH = 46
    const totalW = cellW * (cap + 1)
    const startX = (620 - totalW) / 2
    const y = 140

    // 标题
    ctx.fillStyle = MUTED
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText('一维数组 f[]（全程只有这一行）', startX, y - 8)
    // 扫描方向提示：与标题同一基线、靠右，和箭头位置无关
    ctx.fillStyle = CELL_ACTIVE_STROKE
    ctx.font = '700 12px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('J 从大到小 ←', startX + totalW, y - 8)

    // 来源格集合（本帧读到的）
    const sources = new Set<number>()
    for (const t of frame.trials) {
        if (!t.skipped && t.source >= 0) sources.add(t.source)
    }

    for (let j = 0; j <= cap; j++) {
        const x = startX + j * cellW
        const isCurrent = frame.kind === 'capacity' && j === frame.capacity
        const isChanged = isCurrent && frame.changed
        const isSource = sources.has(j) && !isCurrent

        let fill = CELL_FILL
        let stroke = CELL_STROKE
        let lw = 1
        if (isSource) { fill = CELL_SOURCE; stroke = CELL_SOURCE_STROKE; lw = 1.6 }
        if (isCurrent) { fill = CELL_ACTIVE; stroke = CELL_ACTIVE_STROKE; lw = 2 }
        if (isChanged) { fill = CELL_CHANGED; stroke = CELL_CHANGED_STROKE; lw = 2.4 }

        ctx.beginPath()
        ctx.rect(x, y, cellW, cellH)
        ctx.fillStyle = fill
        ctx.fill()
        ctx.strokeStyle = stroke
        ctx.lineWidth = lw
        ctx.stroke()

        // 下标
        ctx.fillStyle = MUTED
        ctx.font = '11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(String(j), x + cellW / 2, y + cellH + 4)

        // 值
        ctx.fillStyle = INK
        ctx.font = '700 15px system-ui, sans-serif'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(frame.snapshot[j]), x + cellW / 2, y + cellH / 2)
    }
}

/** J 指针：从右往左走。 */
function drawPointer(ctx: CanvasRenderingContext2D, frame: Frame, spec: GroupedSpec): void {
    if (frame.kind !== 'capacity') return
    const cap = spec.capacity
    const cellW = 54
    const totalW = cellW * (cap + 1)
    const startX = (620 - totalW) / 2
    const y = 150
    const cx = startX + frame.capacity * cellW + cellW / 2

    // 上方箭头指向当前格
    ctx.beginPath()
    ctx.moveTo(cx, y - 26)
    ctx.lineTo(cx, y - 8)
    ctx.strokeStyle = CELL_ACTIVE_STROKE
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, y - 4)
    ctx.lineTo(cx - 5, y - 12)
    ctx.lineTo(cx + 5, y - 12)
    ctx.closePath()
    ctx.fillStyle = CELL_ACTIVE_STROKE
    ctx.fill()

}

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number,
): void {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
}
