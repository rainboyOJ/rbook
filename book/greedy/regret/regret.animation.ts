import type { AnimationContext } from '@rbook/animation'
import { createSnapshotPlayer } from '@rbook/animation'
import { buildFrames, TASKS, type Frame } from './regret-model'

const STYLES = `
:host { display:block; font-family:system-ui,sans-serif; }
* { box-sizing:border-box; }
.regret { --paper:#fff; --ink:#26322e; --muted:#647168; --line:#cbd4cd; --idle:#f3f5f2; --ok:#e1eee6; --current:#f9edce; --bad:#f5dfdc; --accent:#24695c; margin:24px 0; padding:18px; border:1px solid var(--line); background:var(--paper); color:var(--ink); font-size:13px; line-height:1.6; }
.regret[data-theme=dark] { --paper:#202823; --ink:#e0e9e2; --muted:#a9b8ad; --line:#4a5b4e; --idle:#28322b; --ok:#2b4636; --current:#51462e; --bad:#51332f; --accent:#9bc7af; }
h3 { margin:0 0 8px; font-size:16px; font-weight:600; }
p { margin:8px 0; }
.muted { color:var(--muted); }
.scroll { overflow:auto; padding:3px 2px 9px; }
.row { display:grid; grid-template-columns:repeat(5,minmax(100px,1fr)); gap:9px; min-width:540px; }
.tile { border:1px solid var(--line); background:var(--idle); text-align:center; padding:10px 5px; position:relative; font-variant-numeric:tabular-nums; }
.tile strong { display:block; font-size:19px; font-weight:550; }
.tile small { color:var(--muted); font-size:11px; }
.tile.kept { background:var(--ok); border-color:var(--accent); }
.tile.current { outline:2px solid var(--accent); outline-offset:1px; background:var(--current); }
.tile.removed { border-style:dashed; background:var(--bad); }
.tile .mark { position:absolute; right:5px; top:1px; font-size:13px; }
.heap .tile { padding:7px; }
.heap .tile:first-child:not(.empty) { border-width:2px; border-color:var(--accent); }
.heap .empty { opacity:.5; border-style:dashed; }
.metrics { display:flex; flex-wrap:wrap; gap:10px 24px; padding:11px 0; border-block:1px solid var(--line); margin:8px 0 14px; }
.metrics b { font-size:17px; font-weight:550; padding-left:5px; }
.verdict { margin-left:auto; color:var(--accent); }
.verdict.bad { color:var(--ink); background:var(--bad); padding:0 6px; }
.message { min-height:44px; }
.legend { display:flex; flex-wrap:wrap; gap:6px 20px; font-size:11px; color:var(--muted); }
.regret .snapshot-player__button,.regret .snapshot-player__speed { border-radius:0; background:var(--paper); color:var(--ink); border-color:var(--line); min-height:40px; }
.regret .snapshot-player__button:hover:not(:disabled) { background:var(--idle); border-color:var(--accent); }
.regret .snapshot-player__progress { color:var(--muted); font-size:12px; }
@media(max-width:520px) { .regret { padding:12px; } .metrics { gap:8px 18px; } .verdict { margin-left:0; } }
`

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'regret'
    shell.innerHTML = `
      <h3>先加入，再决定谁留下</h3>
      <p class="muted">上排按截止时间扫描。下排是大根堆的真实层序数组，不是执行顺序。窄屏可横向滚动。</p>
      <div class="scroll"><div class="row tasks" aria-label="按截止时间排列的任务"></div></div>
      <div class="metrics"><span>总耗时<b class="total"></b></span><span>截止时间<b class="deadline"></b></span><span>候选个数<b class="count"></b></span><strong class="verdict"></strong></div>
      <p class="muted">大根堆 · 左端为堆顶（耗时最大）</p>
      <div class="scroll"><div class="row heap" aria-label="大根堆的层序数组"></div></div>
      <p class="selection"></p>
      <p class="step-title" aria-live="polite"></p><p class="message" aria-live="polite"></p>
      <div class="legend"><span>✓ 保留</span><span>→ 当前任务</span><span>✗ 已撤销</span></div>
      <div class="player"></div>
    `
    context.root.append(style, shell)
    const taskRow = shell.querySelector('.tasks')!
    const heapRow = shell.querySelector('.heap')!
    // All slots are created up front. Playback only restores recorded values.
    const taskCells = TASKS.map(task => {
        const cell = document.createElement('div')
        cell.className = 'tile'
        cell.innerHTML = `<span class="mark"></span><strong>${task.id}</strong><small>t=${task.duration} | d=${task.deadline}</small>`
        taskRow.append(cell)
        return cell
    })
    const heapCells = TASKS.map(() => {
        const cell = document.createElement('div'); cell.className = 'tile empty'; heapRow.append(cell); return cell
    })
    const query = (selector: string) => shell.querySelector<HTMLElement>(selector)!
    function render(frame: Frame) {
        taskCells.forEach((cell, i) => {
            const id = TASKS[i].id, kept = frame.selected.includes(id), removed = frame.removed.includes(id)
            cell.className = `tile${kept ? ' kept' : ''}${removed ? ' removed' : ''}${frame.current === id ? ' current' : ''}`
            cell.querySelector('.mark')!.textContent = removed ? '✗' : frame.current === id ? '→' : kept ? '✓' : ''
        })
        heapCells.forEach((cell, i) => {
            const task = TASKS.find(t => t.id === frame.heap[i])
            cell.textContent = task ? `${task.id}: ${task.duration}` : '—'
            cell.className = `tile${task ? ' kept' : ' empty'}`
        })
        query('.total').textContent = String(frame.total)
        query('.deadline').textContent = frame.deadline === null ? '—' : String(frame.deadline)
        query('.count').textContent = String(frame.selected.length)
        const bad = frame.deadline !== null && frame.total > frame.deadline
        query('.verdict').textContent = bad ? '超时 · 临时候选' : frame.kind === 'start' ? '尚未开始' : '可行'
        query('.verdict').className = `verdict${bad ? ' bad' : ''}`
        query('.selection').textContent = `候选任务（截止时间顺序）：${frame.selected.join('、') || '空'}`
        query('.step-title').textContent = frame.title
        query('.message').textContent = frame.message
        shell.dataset.kind = frame.kind
        shell.dataset.discarded = frame.discarded ?? ''
    }
    const syncTheme = () => { shell.dataset.theme = document.documentElement.dataset.theme || 'light' }
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const player = createSnapshotPlayer({ root: query('.player'), steps: buildFrames(), render, intervalMs: 1000 })
    context.onCleanup(() => { observer.disconnect(); player.destroy() })
}
