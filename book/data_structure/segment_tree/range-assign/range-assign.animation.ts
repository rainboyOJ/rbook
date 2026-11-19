import { createSnapshotPlayer, type AnimationContext } from '@rbook/animation'
import { buildFrames, type Frame } from './range-assign-model'
import layout from '../update_range/tree-layout.json'

const NS = 'http://www.w3.org/2000/svg'
const STYLE = `
:host{display:block;font-family:system-ui,sans-serif;color:#222}
*{box-sizing:border-box}.lesson{margin:20px 0;padding:16px;border:1px solid #bbb;background:#fff;font-size:14px;line-height:1.7}
h3{margin:0 0 8px;font-size:17px}p{margin:8px 0}.legend{font-size:12px;color:#555}.scroll{overflow-x:auto}
svg{display:block;max-width:none;min-width:620px;width:100%;height:auto;background:#fff}
.node rect{fill:#fff;stroke:#555;stroke-width:1.2}.node.pending rect{stroke-dasharray:5 4}.node.active rect{fill:#ececec;stroke:#111;stroke-width:2.6}
.node text{fill:#222;text-anchor:middle;font-family:ui-monospace,monospace;font-size:16px}.node .range{font-size:14px}
.edge{stroke:#777;stroke-width:1.2}.message{min-height:52px}.step-title{font-weight:600;min-height:24px}.answers{font-variant-numeric:tabular-nums;border-block:1px solid #ccc;padding:8px 0}
.lesson .snapshot-player__button,.lesson .snapshot-player__speed{border-radius:0;color:#222;border-color:#aaa;background:#fff;min-height:40px}
.lesson .snapshot-player__button:hover:not(:disabled){background:#eee;border-color:#222}.lesson .snapshot-player__progress{font-size:12px;color:#555}
@media(max-width:520px){.lesson{padding:10px}.message{min-height:76px}}
`
function element<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
    const node = document.createElementNS(NS, tag)
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value))
    return node
}

export function mount(context: AnimationContext): void {
    const style = document.createElement('style'); style.textContent = STYLE
    const shell = document.createElement('section'); shell.className = 'lesson'
    shell.innerHTML = `<h3>区间赋值与覆盖标记</h3>
      <p>固定样例：[1,-2,3,4,5]。按文章中的八次操作逐步执行。</p>
      <p class="legend">has=1 表示 lazy 有效，包括赋值为零；has=0 时 lazy 旧值无效。虚线框：尚未同步祖先赋值；加粗框：当前节点。窄屏可横向滚动。</p>
      <div class="scroll" tabindex="0" aria-label="树图，可横向滚动查看全部节点"></div><p class="step-title" aria-live="polite"></p>
      <p class="message" aria-live="polite"></p><p class="answers"></p><div class="player"></div>`
    context.root.append(style, shell)
    const svg = element('svg', { viewBox: `0 0 ${layout.width} ${layout.height}`, role: 'img', 'aria-label': '五元素线段树，每个节点显示编号、区间、sum、lazy 与 has' })
    const positions = new Map(layout.nodes.map(n => [n.p, n]))
    // 坐标由 sd-core-extra 的树布局模板预计算，静态图与动画共用。
    for (const edge of layout.edges) {
        const a = positions.get(edge.from)!, b = positions.get(edge.to)!
        svg.append(element('line', { class: 'edge', x1: a.x, y1: a.y + 45, x2: b.x, y2: b.y - 45 }))
    }
    const cells = new Map<number, { group: SVGGElement; range: SVGTextElement; sum: SVGTextElement; lazy: SVGTextElement; has: SVGTextElement }>()
    // 先建立全部节点，播放时只恢复快照，不重新执行算法。
    for (const n of layout.nodes) {
        const group = element('g', { class: 'node', 'data-node': n.p })
        const range = element('text', { x: n.x, y: n.y - 24, class: 'range' })
        const sum = element('text', { x: n.x, y: n.y - 3, class: 'sum' })
        const lazy = element('text', { x: n.x, y: n.y + 17, class: 'lazy' })
        const has = element('text', { x: n.x, y: n.y + 37, class: 'has' })
        group.append(element('rect', { x: n.x - 68, y: n.y - 45, width: 136, height: 90 }), range, sum, lazy, has)
        svg.append(group); cells.set(n.p, { group, range, sum, lazy, has })
    }
    const scroll = shell.querySelector<HTMLElement>('.scroll')!
    scroll.append(svg)
    // 窄屏先显示根附近的结构，保留横向滚动；宽屏显示完整树图。
    const observer = new ResizeObserver(() => {
        if (svg.getBoundingClientRect().width > scroll.clientWidth) {
            const scale = svg.getBoundingClientRect().width / layout.width
            scroll.scrollLeft = positions.get(1)!.x * scale - scroll.clientWidth / 2
        } else scroll.scrollLeft = 0
    })
    observer.observe(scroll)
    const title = shell.querySelector<HTMLElement>('.step-title')!
    const message = shell.querySelector<HTMLElement>('.message')!
    const answers = shell.querySelector<HTMLElement>('.answers')!
    function render(frame: Frame): void {
        const byId = new Map(frame.nodes.map(n => [n.p, n]))
        for (const n of frame.nodes) {
            let pending = false
            for (let p = Math.floor(n.p / 2); p; p = Math.floor(p / 2)) {
                if (byId.get(p)!.has) pending = true
            }
            const cell = cells.get(n.p)!
            cell.group.setAttribute('class', `node${pending ? ' pending' : ''}${frame.active.includes(n.p) ? ' active' : ''}`)
            cell.range.textContent = `p=${n.p} [${n.l},${n.r}]`
            cell.sum.textContent = `sum=${n.sum}`
            cell.lazy.textContent = `lazy=${n.lazy}`
            cell.lazy.style.fill = n.has ? '#222' : '#777'
            cell.has.textContent = `has=${Number(n.has)}`
            cell.has.style.fontWeight = n.has ? '700' : '400'
        }
        shell.dataset.kind = frame.kind; shell.dataset.operation = String(frame.operation)
        title.textContent = frame.title; message.textContent = frame.message
        answers.textContent = `已输出：${frame.answers.join('，') || '暂无'}`
    }
    const player = createSnapshotPlayer({ root: shell.querySelector<HTMLElement>('.player')!, steps: buildFrames(), render, intervalMs: 1000 })
    context.onCleanup(() => { observer.disconnect(); player.destroy() })
}
