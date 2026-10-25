import { createSnapshotPlayer, type AnimationContext, type SnapshotPlayer } from '@rbook/animation'

/** 一个物品：编号从 1 开始，重量与价值都是非负整数。 */
export interface KnapsackItem {
    readonly index: number
    readonly weight: number
    readonly value: number
}

type Phase = 'initial' | 'fill' | 'trace' | 'done'

interface CellRef {
    readonly row: number
    readonly col: number
}

/** 推导当前格时用到的上一行格子；role 区分「不选」与「选」。 */
interface Source extends CellRef {
    readonly role: 'skip' | 'take'
}

/** 一步快照：表格数据本身也放进快照，回退时不需要逆向计算。 */
export interface KnapsackStep {
    readonly phase: Phase
    readonly row: number
    readonly col: number
    readonly table: readonly (readonly (number | null)[])[]
    readonly sources: readonly Source[]
    /** 回溯阶段已经确认过的格子，用于在最后一步把「选中路径」留在表上。 */
    readonly path: readonly CellRef[]
    /** 已经从答案回溯确认「被选中」的物品编号。 */
    readonly chosen: readonly number[]
    readonly message: string
}

const DEFAULT_ITEMS = '2 6, 2 3, 6 5, 5 4, 4 6'
const DEFAULT_CAPACITY = 7
const MAX_ITEMS = 8
const MAX_CAPACITY = 12

const STYLES = `
:host { color: #172033; color-scheme: light; display: block; font-family: system-ui, sans-serif; }
* { box-sizing: border-box; }
.knapsack-dp { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; margin: 16px 0; padding: 16px; }
.knapsack-dp__form { display: grid; gap: 10px; grid-template-columns: minmax(0, 2.4fr) minmax(90px, .6fr) auto; }
.knapsack-dp__field { display: grid; gap: 5px; min-width: 0; }
.knapsack-dp__field span { color: #475569; font-size: 13px; font-weight: 650; }
.knapsack-dp input { background: #fff; border: 1px solid #94a3b8; border-radius: 6px; color: #172033; font: inherit; height: 38px; min-width: 0; padding: 0 10px; width: 100%; }
.knapsack-dp input:focus { border-color: #0e7490; outline: 3px solid rgba(14, 116, 144, .18); }
.knapsack-dp__apply { align-self: end; background: #0e7490; border: 0; border-radius: 6px; color: #fff; cursor: pointer; font: inherit; font-weight: 650; height: 38px; padding: 0 16px; }
.knapsack-dp__apply:hover { background: #155e75; }
.knapsack-dp__error { color: #b91c1c; font-size: 14px; margin: 8px 0 0; min-height: 20px; }
.knapsack-dp__legend { color: #475569; display: flex; flex-wrap: wrap; font-size: 12px; gap: 6px 14px; margin: 4px 0 0; padding: 0; list-style: none; }
.knapsack-dp__legend li { align-items: center; display: flex; gap: 5px; }
.knapsack-dp__swatch { border-radius: 3px; display: inline-block; height: 12px; width: 12px; }
.knapsack-dp__stage { margin-top: 10px; }
.knapsack-dp canvas { display: block; height: 288px; max-width: 100%; width: 100%; }
.knapsack-dp__message { color: #334155; font-size: 15px; line-height: 1.55; margin: 8px 0 0; min-height: 48px; }
@media (max-width: 620px) {
  .knapsack-dp { padding: 12px; }
  .knapsack-dp__form { grid-template-columns: minmax(0, 1fr) 90px; }
  .knapsack-dp__apply { grid-column: 1 / -1; width: 100%; }
  .knapsack-dp__message { font-size: 14px; }
}
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'knapsack-dp'
    shell.innerHTML = `
      <form class="knapsack-dp__form">
        <label class="knapsack-dp__field">
          <span>物品（每对是「重量 价值」）</span>
          <input name="items" value="${DEFAULT_ITEMS}" autocomplete="off">
        </label>
        <label class="knapsack-dp__field">
          <span>背包容量 C</span>
          <input name="capacity" value="${DEFAULT_CAPACITY}" inputmode="numeric" autocomplete="off">
        </label>
        <button class="knapsack-dp__apply" type="submit">应用</button>
      </form>
      <p class="knapsack-dp__error" role="alert" aria-live="polite"></p>
      <ul class="knapsack-dp__legend">
        <li><span class="knapsack-dp__swatch" style="background:#f59e0b"></span>当前格</li>
        <li><span class="knapsack-dp__swatch" style="background:#dbeafe;border:1px solid #1d4ed8"></span>来源：不选 f[i-1][j]</li>
        <li><span class="knapsack-dp__swatch" style="background:#fee2e2;border:1px solid #dc2626"></span>来源：选 f[i-1][j-w]+v</li>
        <li><span class="knapsack-dp__swatch" style="background:#0f766e"></span>已确定的选中路径</li>
        <li><span class="knapsack-dp__swatch" style="background:#f8fafc;border:1px solid #e2e8f0"></span>还没算</li>
      </ul>
      <div class="knapsack-dp__stage">
        <canvas aria-label="01 背包二维状态表填表过程"></canvas>
        <p class="knapsack-dp__message" aria-live="polite"></p>
        <div class="knapsack-dp__player"></div>
      </div>
    `
    context.root.append(style, shell)

    const form = required<HTMLFormElement>(shell, 'form')
    const itemsInput = required<HTMLInputElement>(shell, 'input[name="items"]')
    const capacityInput = required<HTMLInputElement>(shell, 'input[name="capacity"]')
    const error = required<HTMLElement>(shell, '.knapsack-dp__error')
    const canvas = required<HTMLCanvasElement>(shell, 'canvas')
    const message = required<HTMLElement>(shell, '.knapsack-dp__message')
    const playerRoot = required<HTMLElement>(shell, '.knapsack-dp__player')

    let items: readonly KnapsackItem[] = parseItems(DEFAULT_ITEMS)
    let capacity = DEFAULT_CAPACITY
    let currentStep: KnapsackStep | undefined
    let player: SnapshotPlayer<KnapsackStep>

    const render = (step: KnapsackStep) => {
        currentStep = step
        message.textContent = step.message
        draw(canvas, items, capacity, step)
    }

    /** 行数随物品数变化，画布高度按行数算，保证格子不会被压扁。 */
    const resizeCanvas = () => {
        const rows = Math.max(3, items.length + 2)
        canvas.style.height = `${Math.min(460, Math.max(220, 78 + rows * 30))}px`
    }

    resizeCanvas()
    player = createSnapshotPlayer({
        root: playerRoot,
        steps: buildSteps(items, capacity),
        render,
    })

    const resizeObserver = new ResizeObserver(() => {
        if (currentStep) draw(canvas, items, capacity, currentStep)
    })
    resizeObserver.observe(canvas)

    form.addEventListener('submit', event => {
        event.preventDefault()
        try {
            const nextItems = parseItems(itemsInput.value)
            const nextCapacity = parseCapacity(capacityInput.value)
            items = nextItems
            capacity = nextCapacity
            error.textContent = ''
            resizeCanvas()
            player.replaceSteps(buildSteps(items, capacity))
        }
        catch (reason) {
            error.textContent = reason instanceof Error ? reason.message : String(reason)
        }
    })

    context.onCleanup(() => resizeObserver.disconnect())
    context.onCleanup(() => player.destroy())
}

/**
 * 纯计算：按 1.cpp 的填表顺序生成全部快照。
 * f[i][j] 先继承 f[i-1][j]（不选），只有「选」严格更优时才被替换，
 * 因此回溯时 `f[i][j] > f[i-1][j]` 就等价于「第 i 个物品被选中」。
 */
export function buildSteps(items: readonly KnapsackItem[], capacity: number): readonly KnapsackStep[] {
    const n = items.length
    const weight = [0, ...items.map(item => item.weight)]
    const value = [0, ...items.map(item => item.value)]
    const table: (number | null)[][] = Array.from(
        { length: n + 1 },
        () => Array.from<number | null>({ length: capacity + 1 }).fill(null),
    )
    for (let col = 0; col <= capacity; col++) table[0][col] = 0

    const steps: KnapsackStep[] = []
    const snapshot = (partial: Omit<KnapsackStep, 'table'>): KnapsackStep => Object.freeze({
        ...partial,
        sources: Object.freeze(partial.sources.map(source => Object.freeze({ ...source }))),
        path: Object.freeze(partial.path.map(cell => Object.freeze({ ...cell }))),
        chosen: Object.freeze([...partial.chosen]),
        table: Object.freeze(table.map(row => Object.freeze([...row]))),
    })

    steps.push(snapshot({
        phase: 'initial',
        row: 0,
        col: 0,
        sources: [],
        path: [],
        chosen: [],
        message: `边界：前 0 个物品，放不进任何东西，所以 f[0][j] = 0。下面按 i 从 1 到 ${n} 逐行填表。`,
    }))

    for (let i = 1; i <= n; i++) {
        for (let col = 0; col <= capacity; col++) {
            const skipValue = table[i - 1][col] as number
            const sources: Source[] = [{ row: i - 1, col, role: 'skip' }]
            let takeValue: number | undefined
            let best = skipValue

            if (col >= weight[i]) {
                takeValue = (table[i - 1][col - weight[i]] as number) + value[i]
                sources.push({ row: i - 1, col: col - weight[i], role: 'take' })
                if (takeValue > best) best = takeValue
            }

            table[i][col] = best
            steps.push(snapshot({
                phase: 'fill',
                row: i,
                col,
                sources,
                path: [],
                chosen: [],
                message: cellMessage(i, col, items[i - 1], skipValue, takeValue, best),
            }))
        }
    }

    let remaining = capacity
    const chosen: number[] = []
    const path: CellRef[] = []
    for (let i = n; i >= 1; i--) {
        const current = table[i][remaining] as number
        const previous = table[i - 1][remaining] as number
        const chosenHere = current > previous
        if (chosenHere) {
            path.push({ row: i, col: remaining })
            chosen.unshift(i)
        }
        steps.push(snapshot({
            phase: 'trace',
            row: i,
            col: remaining,
            sources: chosenHere
                ? [{ row: i - 1, col: remaining - weight[i], role: 'take' }]
                : [{ row: i - 1, col: remaining, role: 'skip' }],
            path,
            chosen,
            message: chosenHere
                ? `回溯：f[${i}][${remaining}] = ${current} > f[${i - 1}][${remaining}] = ${previous}，说明第 ${i} 个物品一定被选中了；把它的重量 ${weight[i]} 还回去，容量变成 ${remaining - weight[i]}。`
                : `回溯：f[${i}][${remaining}] = ${current} = f[${i - 1}][${remaining}]，说明第 ${i} 个物品没有被选中；容量保持 ${remaining}。`,
        }))
        if (chosenHere) remaining -= weight[i]
    }

    const answer = table[n][capacity] as number
    steps.push(snapshot({
        phase: 'done',
        row: n,
        col: capacity,
        sources: [],
        path: [...path, { row: n, col: capacity }],
        chosen,
        message: chosen.length === 0
            ? `回溯到前 0 个物品，答案 f[${n}][${capacity}] = ${answer}：这些物品一个都装不进背包。`
            : `回溯到前 0 个物品，答案 f[${n}][${capacity}] = ${answer}；被选中的物品是 ${chosen.map(index => describeItem(items[index - 1])).join('、')}，总重量 ${chosen.reduce((sum, index) => sum + weight[index], 0)}。`,
    }))

    return Object.freeze(steps)
}

function cellMessage(
    i: number,
    col: number,
    item: KnapsackItem,
    skipValue: number,
    takeValue: number | undefined,
    best: number,
): string {
    const head = `物品 ${i}（重量 ${item.weight}，价值 ${item.value}），当前容量 ${col}：`
    if (takeValue === undefined) {
        return `${head}容量比重量还小，装不下，只能不选，f[${i}][${col}] = f[${i - 1}][${col}] = ${skipValue}。`
    }
    const takeParts = `选：f[${i - 1}][${col - item.weight}] + ${item.value} = ${takeValue}`
    const skipParts = `不选：f[${i - 1}][${col}] = ${skipValue}`
    if (takeValue > skipValue) {
        return `${head}${takeParts} 大于 ${skipParts}，所以 f[${i}][${col}] = ${best}。`
    }
    if (takeValue === skipValue) {
        return `${head}${takeParts} 与 ${skipParts} 一样大，按代码「只有更大才替换」保留不选的结果，f[${i}][${col}] = ${best}。`
    }
    return `${head}${takeParts} 小于 ${skipParts}，选它反而更亏，f[${i}][${col}] = ${best}。`
}

const COLORS = {
    empty: { fill: '#f8fafc', stroke: '#e2e8f0', text: '#cbd5e1' },
    filled: { fill: '#ffffff', stroke: '#cbd5e1', text: '#172033' },
    current: { fill: '#f59e0b', stroke: '#b45309', text: '#172033' },
    skip: { fill: '#dbeafe', stroke: '#1d4ed8', text: '#1e3a8a' },
    take: { fill: '#fee2e2', stroke: '#dc2626', text: '#991b1b' },
    path: { fill: '#0f766e', stroke: '#115e59', text: '#ffffff' },
}

function draw(
    canvas: HTMLCanvasElement,
    items: readonly KnapsackItem[],
    capacity: number,
    step: KnapsackStep,
): void {
    const width = Math.max(320, Math.floor(canvas.clientWidth))
    const height = Math.max(180, Math.floor(canvas.clientHeight))
    const scale = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.floor(width * scale)
    canvas.height = Math.floor(height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(scale, scale)
    ctx.clearRect(0, 0, width, height)

    const pad = 12
    const topPad = 52
    const headerHeight = 22
    const labelWidth = Math.min(112, Math.max(64, width * 0.17))
    const rows = items.length + 1
    const rowHeight = Math.max(18, Math.min(32, (height - topPad - headerHeight - 10) / rows))
    const columns = capacity + 1
    const cellWidth = (width - pad * 2 - labelWidth) / columns
    const gridLeft = pad + labelWidth
    const gridTop = topPad + headerHeight

    ctx.textAlign = 'left'
    ctx.font = '600 13px system-ui, sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText('状态表 f[i][j]：行 = 前 i 个物品，列 = 背包容量 j', pad, 22)

    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText(`物品数 n = ${items.length}，容量 C = ${capacity}`, pad, 42)

    const answer = step.table[items.length][capacity]
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0f766e'
    ctx.font = '600 12px system-ui, sans-serif'
    ctx.fillText(
        answer === null ? `答案 f[${items.length}][${capacity}] = ?` : `答案 f[${items.length}][${capacity}] = ${answer}`,
        width - pad,
        42,
    )

    // 列头：容量 j
    ctx.textAlign = 'center'
    ctx.font = '600 11px system-ui, sans-serif'
    ctx.fillStyle = '#475569'
    for (let col = 0; col < columns; col++) {
        ctx.fillText(String(col), gridLeft + col * cellWidth + cellWidth / 2, gridTop - 6)
    }
    // 左上角说明单元格含义
    ctx.textAlign = 'left'
    ctx.font = '10px system-ui, sans-serif'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText('i \\ j', pad + 2, gridTop - 6)

    for (let row = 0; row <= items.length; row++) {
        const y = gridTop + row * rowHeight
        drawRowLabel(ctx, pad, y, rowHeight, items[row - 1])

        for (let col = 0; col < columns; col++) {
            const x = gridLeft + col * cellWidth
            const isCurrent = row === step.row && col === step.col
            const source = step.sources.find(cell => cell.row === row && cell.col === col)
            const onPath = step.path.some(cell => cell.row === row && cell.col === col)
            const value = step.table[row][col]
            // 最后一步把答案格也归入「选中路径」，让回溯结果留在表面上。
            const palette = isCurrent && step.phase === 'done'
                ? COLORS.path
                : isCurrent
                    ? COLORS.current
                    : source
                        ? COLORS[source.role]
                        : onPath
                            ? COLORS.path
                            : value === null ? COLORS.empty : COLORS.filled

            ctx.beginPath()
            ctx.roundRect(x + 1, y + 1, Math.max(2, cellWidth - 2), Math.max(2, rowHeight - 2), 4)
            ctx.fillStyle = palette.fill
            ctx.fill()
            ctx.lineWidth = isCurrent || source || onPath ? 1.6 : 1
            ctx.strokeStyle = palette.stroke
            ctx.stroke()

            ctx.fillStyle = palette.text
            ctx.textAlign = 'center'
            const fontSize = Math.max(10, Math.min(14, Math.min(cellWidth, rowHeight) * 0.54))
            ctx.font = `${isCurrent ? 700 : 600} ${fontSize}px system-ui, sans-serif`
            ctx.fillText(
                value === null ? '·' : String(value),
                x + cellWidth / 2,
                y + rowHeight / 2 + fontSize * 0.36,
            )
        }
    }
}

function drawRowLabel(
    ctx: CanvasRenderingContext2D,
    pad: number,
    y: number,
    rowHeight: number,
    item: KnapsackItem | undefined,
): void {
    const baseline = y + rowHeight / 2 + 4
    ctx.textAlign = 'left'
    ctx.font = '600 12px system-ui, sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText(item ? String(item.index) : '0', pad + 2, baseline)
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillStyle = '#64748b'
    ctx.fillText(item ? `(${item.weight}, ${item.value})` : '前 0 个', pad + 16, baseline)
}

function describeItem(item: KnapsackItem): string {
    return `#${item.index}(w=${item.weight},v=${item.value})`
}

/** 解析「重量 价值」成对的物品列表；逗号、分号、换行都可以分隔。 */
export function parseItems(source: string): readonly KnapsackItem[] {
    const numbers = source.match(/\d+/g) ?? []
    if (numbers.length === 0) throw new Error('请至少输入一个物品，每个物品写成「重量 价值」。')
    if (numbers.length % 2 !== 0) throw new Error('物品必须成对给出，例如「2 6, 2 3, 6 5」。')
    const items: KnapsackItem[] = []
    for (let i = 0; i < numbers.length; i += 2) {
        items.push({
            index: items.length + 1,
            weight: Number(numbers[i]),
            value: Number(numbers[i + 1]),
        })
    }
    if (items.length > MAX_ITEMS) throw new Error(`为了保持画面清晰，物品最多 ${MAX_ITEMS} 个。`)
    for (const item of items) {
        if (item.value > 999 || item.weight > 999) throw new Error('重量和价值请控制在 999 以内。')
    }
    return items
}

export function parseCapacity(source: string): number {
    const trimmed = source.trim()
    if (!/^\d+$/.test(trimmed)) throw new Error('背包容量必须是非负整数。')
    const value = Number(trimmed)
    if (value > MAX_CAPACITY) throw new Error(`为了保持画面清晰，容量不超过 ${MAX_CAPACITY}。`)
    return value
}

function required<T extends Element>(root: ParentNode, selector: string): T {
    const value = root.querySelector<T>(selector)
    if (!value) throw new Error(`动画界面缺少元素: ${selector}`)
    return value
}
