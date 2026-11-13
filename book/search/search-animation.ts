import type { AnimationContext } from '@rbook/animation'

const STYLES = `
:host { display:block; font-family:system-ui,sans-serif; }
* { box-sizing:border-box; }
.search-demo { --paper:#fff; --ink:#26322e; --muted:#647168; --line:#bdcbbf; --idle:#f3f5f2; --ok:#e1eee6; --current:#f9edce; --bad:#f5dfdc; --accent:#24695c; --wall:#48584d; margin:24px 0; padding:18px; border:1px solid var(--line); background:var(--paper); color:var(--ink); font-size:13px; line-height:1.65; }
.search-demo[data-theme=dark] { --paper:#202823; --ink:#e0e9e2; --muted:#a9b8ad; --line:#4a5b4e; --idle:#28322b; --ok:#2b4636; --current:#51462e; --bad:#51332f; --accent:#9bc7af; --wall:#4b574f; }
h3 { margin:0 0 8px; font-size:16px; font-weight:600; }
p { margin:8px 0; }.description,.legend { color:var(--muted); }.legend { font-size:11px; }
.message { min-height:66px; border-block:1px solid var(--line); padding:10px 0; }
.queue { display:flex; flex-wrap:wrap; gap:6px; min-height:38px; align-items:center; padding:3px; }
.entry { border:1px solid var(--line); padding:4px 8px; background:var(--idle); font-variant-numeric:tabular-nums; }
.entry:first-child { border-color:var(--accent); border-width:2px; }
.entry.stale { border-style:dashed; color:var(--muted); }
.queue-empty { color:var(--muted); }
.search-demo .snapshot-player__button,.search-demo .snapshot-player__speed { border-radius:0; background:var(--paper); color:var(--ink); border-color:var(--line); min-height:40px; }
.search-demo .snapshot-player__button:hover:not(:disabled) { background:var(--idle); border-color:var(--accent); }
.search-demo .snapshot-player__progress { color:var(--muted); font-size:12px; }
.maze { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); max-width:360px; margin:15px auto; gap:5px; }
.cell { min-height:51px; border:1px solid var(--line); background:var(--idle); display:flex; flex-direction:column; align-items:center; justify-content:center; font-variant-numeric:tabular-nums; }
.cell small { font-size:10px; color:var(--muted); }.cell b { font-size:15px; font-weight:550; }
.cell.visited { background:var(--ok); }.cell.fresh { border:2px solid var(--accent); }.cell.current { background:var(--current); outline:2px solid var(--accent); outline-offset:1px; }.cell.path { background:var(--ok); border:2px solid var(--accent); }.cell.wall { background:var(--wall); color:#fff; }
.graph { display:block; width:100%; height:auto; margin:12px 0; overflow:visible; }
.graph .edge path { stroke:var(--muted); stroke-width:1.4; fill:none; }.graph .edge.paid path { stroke-dasharray:5 4; }.graph .edge text { fill:var(--ink); font-size:20px; }.graph .edge.active path { stroke:var(--accent); stroke-width:3; }.graph .edge.active text { fill:var(--accent); font-weight:650; }
.graph .vertex circle { fill:var(--idle); stroke:var(--line); stroke-width:1.5; }.graph .vertex.settled circle { fill:var(--ok); stroke:var(--accent); }.graph .vertex.current circle { fill:var(--current); stroke:var(--accent); stroke-width:3; }.graph .vertex text { fill:var(--ink); font-size:20px; text-anchor:middle; dominant-baseline:central; }
.distances { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:10px 0; }.distance { padding:7px; text-align:center; background:var(--idle); border:1px solid var(--line); font-variant-numeric:tabular-nums; }.distance.active { border:2px solid var(--accent); background:var(--current); }
@media(max-width:520px) { .search-demo { padding:12px; }.cell { min-height:45px; }.entry { padding:4px 6px; }.message { min-height:96px; } }
`
export function createShell(context: AnimationContext, title: string, description: string) {
    const style = document.createElement('style'); style.textContent = STYLES
    const shell = document.createElement('section'); shell.className = 'search-demo'
    shell.innerHTML = '<h3></h3><p class="description"></p><div class="visual"></div><p>队头 → 队尾</p><div class="queue"></div><p class="message" aria-live="polite"></p><p class="legend"></p><div class="player"></div>'
    shell.querySelector('h3')!.textContent = title
    shell.querySelector('.description')!.textContent = description
    context.root.append(style, shell)
    const syncTheme = () => { shell.dataset.theme = document.documentElement.dataset.theme || 'light' }
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    context.onCleanup(() => observer.disconnect())
    return { shell, query: (selector: string) => shell.querySelector<HTMLElement>(selector)! }
}
export function createQueue(root: HTMLElement, size: number) {
    const empty = document.createElement('span'); empty.className = 'queue-empty'; empty.textContent = '空'
    const slots = Array.from({ length: size }, () => {
        const cell = document.createElement('span'); cell.className = 'entry'; root.append(cell); return cell
    })
    root.append(empty)
    return (entries: readonly { text: string; stale?: boolean }[]) => {
        slots.forEach((slot, i) => {
            slot.hidden = i >= entries.length
            slot.textContent = entries[i]?.text || ''
            slot.className = `entry${entries[i]?.stale ? ' stale' : ''}`
        })
        empty.hidden = entries.length !== 0
    }
}
