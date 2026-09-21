export interface SnapshotRenderContext {
    index: number
    count: number
}

export interface SnapshotPlayerOptions<T> {
    root: HTMLElement
    steps: readonly T[]
    render(step: T, context: SnapshotRenderContext): void
    intervalMs?: number
}

export interface SnapshotPlayer<T> {
    replaceSteps(steps: readonly T[]): void
    reset(): void
    destroy(): void
}

const PLAYER_STYLES = `
.snapshot-player__toolbar {
  align-items: center; display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
}
.snapshot-player__button, .snapshot-player__speed {
  background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; color: #172033;
  font: inherit; height: 36px;
}
.snapshot-player__button { cursor: pointer; min-width: 38px; padding: 0 10px; }
.snapshot-player__button:hover:not(:disabled) { background: #f1f5f9; border-color: #64748b; }
.snapshot-player__button:focus-visible, .snapshot-player__speed:focus-visible {
  outline: 3px solid rgba(14, 116, 144, .25); outline-offset: 1px;
}
.snapshot-player__button:disabled { cursor: default; opacity: .42; }
.snapshot-player__speed { padding: 0 8px; }
.snapshot-player__progress { color: #526072; font-size: 14px; margin-left: auto; white-space: nowrap; }
@media (max-width: 520px) {
  .snapshot-player__progress { margin-left: 0; width: 100%; }
}
`

export function createSnapshotPlayer<T>(opts: SnapshotPlayerOptions<T>): SnapshotPlayer<T> {
    if (opts.steps.length === 0) throw new Error('播放器至少需要一个状态快照')

    const style = document.createElement('style')
    style.textContent = PLAYER_STYLES
    const toolbar = document.createElement('div')
    toolbar.className = 'snapshot-player__toolbar'

    const resetButton = button('↺', '重置')
    const previousButton = button('←', '上一步')
    const playButton = button('▶', '播放')
    const nextButton = button('→', '下一步')
    const speed = document.createElement('select')
    speed.className = 'snapshot-player__speed'
    speed.title = '播放速度'
    speed.setAttribute('aria-label', '播放速度')
    for (const [label, value] of [['0.5×', '2000'], ['1×', '1000'], ['2×', '500']]) {
        const option = document.createElement('option')
        option.textContent = label
        option.value = value
        if (value === String(opts.intervalMs ?? 1000)) option.selected = true
        speed.append(option)
    }
    const progress = document.createElement('span')
    progress.className = 'snapshot-player__progress'
    progress.setAttribute('aria-live', 'polite')

    toolbar.append(resetButton, previousButton, playButton, nextButton, speed, progress)
    opts.root.append(style, toolbar)

    let steps = opts.steps
    let index = 0
    let timer: number | undefined

    const stop = () => {
        if (timer !== undefined) window.clearInterval(timer)
        timer = undefined
        playButton.textContent = '▶'
        playButton.title = '播放'
        playButton.setAttribute('aria-label', '播放')
    }

    const draw = () => {
        opts.render(steps[index], { index, count: steps.length })
        previousButton.disabled = index === 0
        resetButton.disabled = index === 0
        nextButton.disabled = index === steps.length - 1
        progress.textContent = `步骤 ${index + 1} / ${steps.length}`
        if (index === steps.length - 1) stop()
    }

    const go = (nextIndex: number) => {
        index = Math.max(0, Math.min(nextIndex, steps.length - 1))
        draw()
    }

    resetButton.addEventListener('click', () => { stop(); go(0) })
    previousButton.addEventListener('click', () => { stop(); go(index - 1) })
    nextButton.addEventListener('click', () => { stop(); go(index + 1) })
    playButton.addEventListener('click', () => {
        if (timer !== undefined) {
            stop()
            return
        }
        if (index === steps.length - 1) index = 0
        playButton.textContent = 'Ⅱ'
        playButton.title = '暂停'
        playButton.setAttribute('aria-label', '暂停')
        draw()
        timer = window.setInterval(() => go(index + 1), Number(speed.value))
    })
    speed.addEventListener('change', () => {
        if (timer === undefined) return
        stop()
        playButton.click()
    })

    draw()

    return {
        replaceSteps(nextSteps) {
            if (nextSteps.length === 0) throw new Error('播放器至少需要一个状态快照')
            stop()
            steps = nextSteps
            index = 0
            draw()
        },
        reset() { stop(); go(0) },
        destroy() {
            stop()
            toolbar.remove()
            style.remove()
        },
    }
}

function button(symbol: string, label: string): HTMLButtonElement {
    const element = document.createElement('button')
    element.type = 'button'
    element.className = 'snapshot-player__button'
    element.textContent = symbol
    element.title = label
    element.setAttribute('aria-label', label)
    return element
}
