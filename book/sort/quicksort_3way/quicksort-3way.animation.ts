import { createSnapshotPlayer, type AnimationContext, type SnapshotPlayer } from '@rbook/animation'

interface QuickSortStep {
    readonly arr: readonly number[]
    readonly l: number
    readonly r: number
    readonly L?: number
    readonly i?: number
    readonly R?: number
    readonly key?: number
    readonly sorted: readonly boolean[]
    readonly swapPair?: readonly [number, number]
    readonly message: string
}

const STYLES = `
:host { display: block; color-scheme: light; color: #1f2937; font-family: system-ui, "Noto Sans SC", sans-serif; }
* { box-sizing: border-box; }
.qs-card { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 16px; }
.qs-form { display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr) auto; align-items: end; }
.qs-field { display: grid; gap: 5px; }
.qs-field span { color: #475569; font-size: 13px; font-weight: 600; }
.qs-field input { border: 1px solid #94a3b8; border-radius: 6px; font: inherit; height: 36px; min-width: 0; padding: 0 10px; width: 100%; }
.qs-field input:focus { border-color: #2f5d8a; outline: 3px solid rgba(47, 93, 138, 0.16); }
.qs-apply { background: #2f5d8a; border: 0; border-radius: 6px; color: #fff; cursor: pointer; font: inherit; font-weight: 600; height: 36px; padding: 0 16px; }
.qs-apply:hover { background: #23476b; }
.qs-error { color: #b91c1c; font-size: 13px; margin: 6px 0 0; min-height: 18px; }
.qs-meta { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; margin: 8px 0 6px; font-size: 13px; color: #475569; }
.qs-legend { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.qs-legend-item { display: inline-flex; align-items: center; gap: 5px; }
.qs-dot { width: 12px; height: 12px; border-radius: 2px; border: 1px solid #94a3b8; display: inline-block; }
.qs-dot--lt { background: #dce8f5; border-color: #2f5d8a; }
.qs-dot--eq { background: #ffffff; border: 2px solid #1f2937; }
.qs-dot--gt { background: #f7e8d0; border-color: #9a5b13; }
.qs-dot--done { background: #dcfce7; border-color: #15803d; }
.qs-array { display: grid; gap: 4px; margin: 10px 0 8px; font-variant-numeric: tabular-nums; }
.qs-cell { min-width: 0; text-align: center; transition: opacity 0.15s ease; }
.qs-cell--outside { opacity: 0.35; }
.qs-cell--outside.qs-cell--done { opacity: 0.85; }
.qs-ptr { height: 22px; font-size: 12px; font-weight: 700; line-height: 22px; white-space: nowrap; }
.qs-ptr--L { color: #2f5d8a; }
.qs-ptr--i { color: #111827; }
.qs-ptr--R { color: #9a5b13; }
.qs-box { height: 46px; display: flex; align-items: center; justify-content: center; border: 1px solid #94a3b8; border-radius: 4px; font-size: 18px; font-weight: 600; background: #f8fafc; position: relative; }
.qs-cell--lt .qs-box { background: #dce8f5; border-color: #2f5d8a; color: #1e3a5f; }
.qs-cell--eq .qs-box { background: #ffffff; border: 2px solid #1f2937; color: #111827; }
.qs-cell--gt .qs-box { background: #f7e8d0; border-color: #9a5b13; color: #78350f; }
.qs-cell--done .qs-box { background: #dcfce7; border-color: #15803d; color: #14532d; }
.qs-cell--swap .qs-box { box-shadow: 0 0 0 2px #2f5d8a; }
.qs-idx { display: block; margin-top: 4px; font-size: 11px; color: #64748b; }
.qs-msg { margin: 8px 0 0; min-height: 44px; padding: 8px 10px; background: #f8fafc; border-left: 3px solid #2f5d8a; font-size: 14px; line-height: 1.5; color: #1e293b; }
.qs-player { margin-top: 10px; }
@media (max-width: 560px) {
  .qs-card { padding: 12px; }
  .qs-form { grid-template-columns: 1fr; }
  .qs-box { height: 40px; font-size: 15px; }
  .qs-ptr { font-size: 11px; }
}
`

function buildQuickSortSteps(initial: readonly number[]): QuickSortStep[] {
    const a = [...initial]
    const n = a.length
    const sorted = new Array<boolean>(n).fill(false)
    const steps: QuickSortStep[] = []

    const push = (step: Omit<QuickSortStep, 'arr' | 'sorted'>) => {
        steps.push({
            ...step,
            arr: [...a],
            sorted: [...sorted],
        })
    }

    push({
        l: 0,
        r: n - 1,
        message: `初始数组共 ${n} 个元素。点击「下一步」或「播放」，观察三路快排如何一趟划分并递归排序。`,
    })

    function sort(l: number, r: number): void {
        if (l > r) return
        if (l === r) {
            sorted[l] = true
            push({
                l,
                r,
                message: `区间 [${l + 1}, ${r + 1}] 只有 1 个元素 ${a[l]}，直接归位。`,
            })
            return
        }

        const mid = Math.floor((l + r) / 2)
        const key = a[mid]
        let L = l
        let R = r
        let i = l

        push({
            l,
            r,
            L,
            i,
            R,
            key,
            message: `处理区间 [${l + 1}, ${r + 1}]，选取基准值 key = a[${mid + 1}] = ${key}，初始化 L = ${L + 1}，i = ${i + 1}，R = ${R + 1}。`,
        })

        while (i <= R) {
            const val = a[i]
            if (val < key) {
                const oldL = L
                const oldI = i
                ;[a[i], a[L]] = [a[L], a[i]]
                L++
                i++
                push({
                    l,
                    r,
                    L,
                    i,
                    R,
                    key,
                    swapPair: [oldL, oldI],
                    message: `a[${oldI + 1}] = ${val} < ${key}：交换 a[${oldI + 1}] 与 a[${oldL + 1}]，L 右移到 ${L + 1}，i 右移到 ${i + 1}。`,
                })
            } else if (val > key) {
                const oldR = R
                ;[a[i], a[R]] = [a[R], a[i]]
                R--
                push({
                    l,
                    r,
                    L,
                    i,
                    R,
                    key,
                    swapPair: [i, oldR],
                    message: `a[${i + 1}] = ${val} > ${key}：交换 a[${i + 1}] 与 a[${oldR + 1}]，R 左移到 ${R + 1}（换来的数未检查，i 留在 ${i + 1}）。`,
                })
            } else {
                i++
                push({
                    l,
                    r,
                    L,
                    i,
                    R,
                    key,
                    message: `a[${i}] = ${val} == ${key}：留在中间等于区，i 右移到 ${i + 1}。`,
                })
            }
        }

        for (let k = L; k <= R; k++) sorted[k] = true
        push({
            l,
            r,
            L,
            i,
            R,
            key,
            message: `区间 [${l + 1}, ${r + 1}] 划分完成：等于 ${key} 的 [${L + 1}, ${R + 1}] 已全部归位，接下来只递归左右两侧。`,
        })

        sort(l, L - 1)
        sort(R + 1, r)
    }

    sort(0, n - 1)

    push({
        l: -1,
        r: -1,
        message: '排序完成！所有元素均已归位。',
    })

    return steps
}

function parseValues(raw: string): number[] | string {
    const parts = raw
        .split(/[\s,，]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    if (parts.length < 2 || parts.length > 12) {
        return '请输入 2 到 12 个整数（用空格或逗号分隔）。'
    }
    const nums: number[] = []
    for (const part of parts) {
        if (!/^-?\d+$/.test(part)) {
            return `“${part}”不是合法整数。`
        }
        nums.push(Number(part))
    }
    return nums
}

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES

    const shell = document.createElement('section')
    shell.className = 'qs-card'
    shell.innerHTML = `
      <form class="qs-form">
        <label class="qs-field">
          <span>待排序数组（2～12 个整数，可自行修改测试重复元素）</span>
          <input name="values" value="5, 2, 8, 5, 1, 9, 5, 3" autocomplete="off">
        </label>
        <button class="qs-apply" type="submit">重新演示</button>
      </form>
      <p class="qs-error" role="alert" aria-live="polite"></p>
      <div class="qs-meta">
        <span class="qs-range"></span>
        <div class="qs-legend">
          <span class="qs-legend-item"><i class="qs-dot qs-dot--lt"></i>&lt; key</span>
          <span class="qs-legend-item"><i class="qs-dot qs-dot--eq"></i>= key</span>
          <span class="qs-legend-item"><i class="qs-dot qs-dot--gt"></i>&gt; key</span>
          <span class="qs-legend-item"><i class="qs-dot qs-dot--done"></i>已归位</span>
        </div>
      </div>
      <div class="qs-array" role="group" aria-label="三路快速排序数组演示"></div>
      <p class="qs-msg" aria-live="polite"></p>
      <div class="qs-player"></div>
    `
    context.root.append(style, shell)

    const form = shell.querySelector<HTMLFormElement>('form')!
    const input = shell.querySelector<HTMLInputElement>('input[name="values"]')!
    const errorEl = shell.querySelector<HTMLElement>('.qs-error')!
    const rangeEl = shell.querySelector<HTMLElement>('.qs-range')!
    const arrayEl = shell.querySelector<HTMLElement>('.qs-array')!
    const msgEl = shell.querySelector<HTMLElement>('.qs-msg')!
    const playerRoot = shell.querySelector<HTMLElement>('.qs-player')!

    let player: SnapshotPlayer<QuickSortStep> | undefined

    const renderStep = (step: QuickSortStep) => {
        const n = step.arr.length
        arrayEl.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`

        if (step.l >= 0 && step.r >= 0) {
            const keyPart = step.key !== undefined ? `，基准值 key = ${step.key}` : ''
            rangeEl.textContent = `当前区间：[${step.l + 1}, ${step.r + 1}]${keyPart}`
        } else {
            rangeEl.textContent = '状态：全部有序'
        }

        arrayEl.innerHTML = ''
        for (let idx = 0; idx < n; idx++) {
            const cell = document.createElement('div')
            cell.className = 'qs-cell'

            const inRange = step.l >= 0 && idx >= step.l && idx <= step.r
            if (!inRange && step.l >= 0) {
                cell.classList.add('qs-cell--outside')
            }

            if (step.sorted[idx]) {
                cell.classList.add('qs-cell--done')
            } else if (
                inRange &&
                step.L !== undefined &&
                step.i !== undefined &&
                step.R !== undefined
            ) {
                if (idx < step.L) cell.classList.add('qs-cell--lt')
                else if (idx < step.i) cell.classList.add('qs-cell--eq')
                else if (idx > step.R) cell.classList.add('qs-cell--gt')
            }

            if (step.swapPair && (step.swapPair[0] === idx || step.swapPair[1] === idx)) {
                cell.classList.add('qs-cell--swap')
            }

            const ptrTags: string[] = []
            let ptrClass = 'qs-ptr'
            if (step.L === idx) {
                ptrTags.push('L')
                ptrClass += ' qs-ptr--L'
            }
            if (step.i === idx) {
                ptrTags.push('i')
                ptrClass += ' qs-ptr--i'
            }
            if (step.R === idx) {
                ptrTags.push('R')
                ptrClass += ' qs-ptr--R'
            }

            const ptrEl = document.createElement('div')
            ptrEl.className = ptrClass
            ptrEl.textContent = ptrTags.join(' ')

            const boxEl = document.createElement('div')
            boxEl.className = 'qs-box'
            boxEl.textContent = String(step.arr[idx])

            const idxEl = document.createElement('span')
            idxEl.className = 'qs-idx'
            idxEl.textContent = String(idx + 1)

            cell.append(ptrEl, boxEl, idxEl)
            arrayEl.append(cell)
        }

        msgEl.textContent = step.message
    }

    const startWith = (nums: number[]) => {
        player?.destroy()
        const steps = buildQuickSortSteps(nums)
        player = createSnapshotPlayer({
            root: playerRoot,
            steps,
            intervalMs: 850,
            render: renderStep,
        })
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault()
        const parsed = parseValues(input.value)
        if (typeof parsed === 'string') {
            errorEl.textContent = parsed
            return
        }
        errorEl.textContent = ''
        startWith(parsed)
    })

    startWith([5, 2, 8, 5, 1, 9, 5, 3])
    context.onCleanup(() => {
        player?.destroy()
        shell.remove()
        style.remove()
    })
}
