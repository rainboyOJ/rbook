import { createSnapshotPlayer, type AnimationContext, type SnapshotPlayer } from '@rbook/animation'

type Phase = 'initial' | 'select' | 'compare' | 'update' | 'done'

interface BinarySearchStep {
    readonly phase: Phase
    readonly left: number
    readonly right: number
    readonly mid?: number
    readonly message: string
}

const STYLES = `
:host { color: #172033; display: block; font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
.binary-search { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; }
.binary-search__form { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr) minmax(100px, .3fr) auto; }
.binary-search__field { display: grid; gap: 5px; }
.binary-search__field span { color: #475569; font-size: 13px; font-weight: 650; }
.binary-search input { border: 1px solid #94a3b8; border-radius: 6px; font: inherit; height: 38px; min-width: 0; padding: 0 10px; width: 100%; }
.binary-search input:focus { border-color: #0e7490; outline: 3px solid rgba(14, 116, 144, .18); }
.binary-search__apply { align-self: end; background: #0e7490; border: 0; border-radius: 6px; color: #fff; cursor: pointer; font: inherit; font-weight: 650; height: 38px; padding: 0 16px; }
.binary-search__apply:hover { background: #155e75; }
.binary-search__error { color: #b91c1c; font-size: 14px; margin: 8px 0 0; min-height: 20px; }
.binary-search__stage { margin-top: 8px; }
.binary-search canvas { display: block; height: 220px; max-width: 100%; width: 100%; }
.binary-search__message { color: #334155; font-size: 15px; line-height: 1.55; margin: 2px 0 0; min-height: 48px; }
@media (max-width: 620px) {
  .binary-search { padding: 12px; }
  .binary-search__form { grid-template-columns: minmax(0, 1fr) 90px; }
  .binary-search__apply { grid-column: 1 / -1; width: 100%; }
  .binary-search canvas { height: 190px; }
}
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'binary-search'
    shell.innerHTML = `
      <form class="binary-search__form">
        <label class="binary-search__field">
          <span>有序数组（最多 12 个数）</span>
          <input name="values" value="1, 2, 5, 9, 100" autocomplete="off">
        </label>
        <label class="binary-search__field">
          <span>目标值</span>
          <input name="target" value="6" inputmode="decimal" autocomplete="off">
        </label>
        <button class="binary-search__apply" type="submit">应用</button>
      </form>
      <p class="binary-search__error" role="alert" aria-live="polite"></p>
      <div class="binary-search__stage">
        <canvas aria-label="二分查找候选区间图"></canvas>
        <p class="binary-search__message" aria-live="polite"></p>
        <div class="binary-search__player"></div>
      </div>
    `
    context.root.append(style, shell)

    const form = required<HTMLFormElement>(shell, 'form')
    const valuesInput = required<HTMLInputElement>(shell, 'input[name="values"]')
    const targetInput = required<HTMLInputElement>(shell, 'input[name="target"]')
    const error = required<HTMLElement>(shell, '.binary-search__error')
    const canvas = required<HTMLCanvasElement>(shell, 'canvas')
    const message = required<HTMLElement>(shell, '.binary-search__message')
    const playerRoot = required<HTMLElement>(shell, '.binary-search__player')

    let values = [1, 2, 5, 9, 100]
    let target = 6
    let currentStep: BinarySearchStep
    let player: SnapshotPlayer<BinarySearchStep>

    const render = (step: BinarySearchStep) => {
        currentStep = step
        message.textContent = step.message
        draw(canvas, values, target, step)
    }

    player = createSnapshotPlayer({
        root: playerRoot,
        steps: buildSteps(values, target),
        render,
    })

    const resizeObserver = new ResizeObserver(() => {
        if (currentStep) draw(canvas, values, target, currentStep)
    })
    resizeObserver.observe(canvas)

    form.addEventListener('submit', event => {
        event.preventDefault()
        try {
            const nextValues = parseValues(valuesInput.value)
            const nextTarget = parseTarget(targetInput.value)
            values = nextValues
            target = nextTarget
            error.textContent = ''
            player.replaceSteps(buildSteps(values, target))
        }
        catch (reason) {
            error.textContent = reason instanceof Error ? reason.message : String(reason)
        }
    })

    context.onCleanup(() => resizeObserver.disconnect())
    context.onCleanup(() => player.destroy())
}

export function buildSteps(values: readonly number[], target: number): readonly BinarySearchStep[] {
    const steps: BinarySearchStep[] = []
    let left = 0
    let right = values.length
    const at = (index: number) => index === values.length ? Number.POSITIVE_INFINITY : values[index]

    steps.push(freezeStep({
        phase: 'initial', left, right,
        message: `在位置 1 到 ${values.length + 1} 中寻找第一个大于等于 ${target} 的元素；末尾补上哨兵 ∞。`,
    }))

    while (left < right) {
        const mid = Math.floor((left + right) / 2)
        const midValue = at(mid)
        steps.push(freezeStep({
            phase: 'select', left, right, mid,
            message: `候选区间是 [${left + 1}, ${right + 1}]，取中点 ${mid + 1}。`,
        }))
        steps.push(freezeStep({
            phase: 'compare', left, right, mid,
            message: `${formatValue(midValue)} ${midValue >= target ? '≥' : '<'} ${target}，因此答案${midValue >= target ? '不会在中点右侧' : '一定在中点右侧'}。`,
        }))

        if (midValue >= target) right = mid
        else left = mid + 1

        steps.push(freezeStep({
            phase: 'update', left, right,
            message: `排除不可能的部分，新的候选区间是 [${left + 1}, ${right + 1}]。`,
        }))
    }

    steps.push(freezeStep({
        phase: 'done', left, right,
        message: left === values.length
            ? `区间收缩到位置 ${left + 1}，得到哨兵 ∞：数组中没有大于等于 ${target} 的元素。`
            : `区间收缩到位置 ${left + 1}，${values[left]} 是第一个大于等于 ${target} 的元素。`,
    }))
    return Object.freeze(steps)
}

function draw(canvas: HTMLCanvasElement, values: readonly number[], target: number, step: BinarySearchStep): void {
    const width = Math.max(280, Math.floor(canvas.clientWidth))
    const height = Math.max(180, Math.floor(canvas.clientHeight))
    const scale = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.clearRect(0, 0, width, height)

    const allValues = [...values, Number.POSITIVE_INFINITY]
    const gap = Math.max(3, Math.min(8, width / 80))
    const cellWidth = Math.min(64, (width - 16 - gap * (allValues.length - 1)) / allValues.length)
    const totalWidth = cellWidth * allValues.length + gap * (allValues.length - 1)
    const startX = Math.max(8, (width - totalWidth) / 2)
    const top = 62
    const cellHeight = Math.min(58, height * .32)

    ctx.textAlign = 'center'
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.fillStyle = '#475569'
    ctx.fillText(`目标值：${target}`, width / 2, 24)
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillText(`候选区间 [${step.left + 1}, ${step.right + 1}]`, width / 2, 44)

    allValues.forEach((value, index) => {
        const x = startX + index * (cellWidth + gap)
        const candidate = index >= step.left && index <= step.right
        const isMid = index === step.mid
        const isAnswer = step.phase === 'done' && index === step.left
        ctx.fillStyle = isAnswer ? '#0f766e' : isMid ? '#f59e0b' : candidate ? '#d1fae5' : '#e2e8f0'
        ctx.strokeStyle = isAnswer ? '#115e59' : isMid ? '#b45309' : candidate ? '#5b8f78' : '#cbd5e1'
        ctx.lineWidth = isAnswer || isMid ? 2 : 1
        roundedRect(ctx, x, top, cellWidth, cellHeight, 5)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = isAnswer ? '#fff' : '#172033'
        ctx.font = `600 ${cellWidth < 34 ? 11 : 14}px system-ui, sans-serif`
        ctx.fillText(formatValue(value), x + cellWidth / 2, top + cellHeight / 2 + 5)
        ctx.fillStyle = '#64748b'
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillText(String(index + 1), x + cellWidth / 2, top + cellHeight + 18)
        if (isMid) {
            ctx.fillStyle = '#92400e'
            ctx.font = '600 11px system-ui, sans-serif'
            ctx.fillText('mid', x + cellWidth / 2, top - 8)
        }
    })
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
}

function parseValues(source: string): number[] {
    const parts = source.split(/[\s,，]+/).filter(Boolean)
    if (parts.length === 0) throw new Error('请输入至少一个数组元素。')
    if (parts.length > 12) throw new Error('为了保持画面清晰，数组最多包含 12 个元素。')
    const values = parts.map(Number)
    if (values.some(value => !Number.isFinite(value))) throw new Error('数组只能包含有限数字。')
    if (values.some((value, index) => index > 0 && values[index - 1] > value)) {
        throw new Error('数组必须按从小到大排列，可以包含重复值。')
    }
    return values
}

function parseTarget(source: string): number {
    const value = Number(source.trim())
    if (!source.trim() || !Number.isFinite(value)) throw new Error('目标值必须是一个有限数字。')
    return value
}

function freezeStep(step: BinarySearchStep): BinarySearchStep {
    return Object.freeze(step)
}

function formatValue(value: number): string {
    return value === Number.POSITIVE_INFINITY ? '∞' : String(value)
}

function required<T extends Element>(root: ParentNode, selector: string): T {
    const value = root.querySelector<T>(selector)
    if (!value) throw new Error(`动画界面缺少元素: ${selector}`)
    return value
}
