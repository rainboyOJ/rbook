import { createSnapshotPlayer, type AnimationContext } from '@rbook/animation'
import type { PointerFrame } from './pointer-model'

interface FigureOptions {
    readonly kind: 'pair' | 'window'
    readonly title: string
    readonly values: readonly number[]
    readonly target: number
    readonly frames: readonly PointerFrame[]
}

const STYLES = `
:host { display:block; color-scheme:light; color:#222;
 font-family:Georgia,"Noto Serif CJK SC","Songti SC",SimSun,serif; }
* { box-sizing:border-box; }
.figure { margin:24px 0; border:1px solid #aaa; background:#fff;
 overflow:hidden; font-size:14px; line-height:1.7; }
.heading { padding:18px 24px 14px; border-bottom:1px solid #aaa; text-align:center; }
h3 { margin:0; font-size:21px; font-weight:600; }
.content { padding:18px 24px; }
.array { display:grid; position:relative; margin:12px 0; font-variant-numeric:tabular-nums; }
.cell { min-width:0; text-align:center; }
.pointer { height:28px; font-size:14px; font-style:italic; }
.value { display:block; border:1px solid #aaa; border-right:0; padding:8px 0;
 font-family:Georgia,"Times New Roman",serif; font-size:24px; line-height:1.5; }
.cell:last-of-type .value { border-right:1px solid #aaa; }
.index { display:block; padding-top:5px; color:#555; font-size:12px; }
.selected .value { background:#e5e5e5; }
.pair .selected .value { outline:2px solid #222; outline-offset:-2px; }
.discarded .value { color:#888; text-decoration:line-through; }
.range { position:absolute; top:28px; height:54px; border:2px solid #222; pointer-events:none; }
.equation { margin:14px 0 4px; min-height:28px; text-align:center; font-size:18px;
 font-family:Georgia,"Noto Serif CJK SC","Songti SC",SimSun,serif; font-variant-numeric:tabular-nums; }
.metrics { display:flex; justify-content:center; gap:12px 28px; flex-wrap:wrap; margin:8px 0;
 font-variant-numeric:tabular-nums; }
.caption { margin:8px 0 0; color:#555; text-align:center; font-size:12px; }
.controls { margin-top:16px; padding-top:10px; border-top:1px solid #ccc; }
.figure .snapshot-player__toolbar { margin-top:0; gap:8px; font:13px/1.7 system-ui,sans-serif; }
.figure .snapshot-player__button,.figure .snapshot-player__speed {
 min-height:40px; height:auto; padding:6px 12px; border:1px solid #999;
 border-radius:0; color:#222; background:#fff; }
.figure .snapshot-player__button:hover:not(:disabled) { background:#eee; border-color:#222; }
.figure .snapshot-player__button:focus-visible,.figure .snapshot-player__speed:focus-visible {
 outline:2px solid #222; outline-offset:3px; }
.figure .snapshot-player__progress { color:#555; font-size:12px; }
[hidden] { display:none !important; }
@media(max-width:560px) {
 .heading { padding:14px; } .content { padding:12px; } h3 { font-size:19px; }
 .value { font-size:19px; padding:10px 0; }
 .range { height:50.5px; }
 .pointer { font-size:12px; }
 .index { font-size:11px; }
 .figure .snapshot-player__button,.figure .snapshot-player__speed { min-height:44px; }
}
@media print {
 .figure { border:0; color:#000; break-inside:avoid; }
 .controls { display:none; }
}
`

export function mountPointerFigure(context: AnimationContext, options: FigureOptions): void {
    const { kind, values, target, frames } = options
    const style = document.createElement('style')
    style.textContent = STYLES
    const figure = document.createElement('section')
    figure.className = `figure ${kind}`
    figure.setAttribute('aria-label', options.title)
    figure.innerHTML = `
      <header class="heading"><h3></h3></header>
      <div class="content">
        <div class="array" role="group" aria-label="数组与左右指针"></div>
        <p class="equation" aria-live="polite"></p>
        <div class="metrics"></div>
        <p class="caption"></p>
        <div class="controls"></div>
      </div>
    `
    const find = <T extends HTMLElement>(selector: string) => figure.querySelector<T>(selector)!
    find('h3').textContent = options.title
    const array = find('.array')
    array.style.gridTemplateColumns = `repeat(${values.length}, minmax(0, 1fr))`
    const cards = values.map((value, i) => {
        const card = document.createElement('div')
        card.className = 'cell'
        card.innerHTML = `<div class="pointer"></div><span class="value">${value}</span><span class="index">${i + 1}</span>`
        array.append(card)
        return card
    })
    const range = document.createElement('span')
    range.className = 'range'
    range.setAttribute('aria-hidden', 'true')
    array.append(range)
    const equation = find('.equation')
    const metrics = find('.metrics')
    const targetLabel = document.createElement('span')
    const bestLabel = document.createElement('span')
    targetLabel.textContent = `目标 ${kind === 'pair' ? 'm' : 'S'} = ${target}`
    metrics.append(targetLabel)
    if (kind === 'window') metrics.append(bestLabel)
    find('.caption').textContent = kind === 'pair'
        ? '灰底为当前配对，划线为已排除位置；下行为下标。'
        : '粗框为当前窗口，下行为下标。'
    context.root.append(style, figure)

    const player = createSnapshotPlayer({
        root: find('.controls'),
        steps: frames,
        intervalMs: 2000,
        render(frame) {
            const { left, right, sum } = frame
            const empty = left > right || (kind === 'pair' && left === right)
            cards.forEach((card, i) => {
                const selected = !empty && (kind === 'pair'
                    ? i === left || i === right : i >= left && i <= right)
                const discarded = kind === 'pair' && (empty || i < left || i > right)
                card.classList.toggle('selected', selected)
                card.classList.toggle('discarded', discarded)
                const labels = [i === left ? 'l' : '', i === right ? 'r' : ''].filter(Boolean)
                card.querySelector('.pointer')!.textContent = !empty && labels.length ? `${labels.join(',')} ↓` : ''
                card.setAttribute('aria-label', `位置 ${i + 1}，值 ${values[i]}${discarded ? '，已排除' : selected ? '，当前选中' : ''}`)
            })
            range.hidden = kind !== 'window' || empty
            range.style.left = `${100 * left / values.length}%`
            range.style.width = `${100 * Math.max(0, right - left + 1) / values.length}%`
            if (kind === 'pair') {
                const relation = sum === target ? '=' : sum < target ? '<' : '>'
                equation.textContent = empty ? '无解' : `${values[left]} + ${values[right]} = ${sum} ${sum === target ? '' : `${relation} ${target}`}`.trim()
            } else {
                const relation = sum >= target ? '≥' : '<'
                equation.textContent = `sum = ${sum} ${relation} ${target}`
                bestLabel.textContent = `最短长度 = ${frame.best || '—'}`
            }
        },
    })
    context.onCleanup(() => {
        player.destroy()
        figure.remove()
        style.remove()
    })
}
