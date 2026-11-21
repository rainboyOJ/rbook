import type { AnimationContext } from '@rbook/animation'
import { GAME_EDGES, VERTEX_COUNT, selectionStats, toggleGameEdge } from './edge-game-model'

const SVG_NS = 'http://www.w3.org/2000/svg'
const FLASH_MS = 2400
const STYLES = `
:host { display: block; color: var(--rbook-text, #172033); font-family: var(--rbook-font-heading, system-ui, sans-serif); }
* { box-sizing: border-box; }
.game { margin: 20px 0; border: 1px solid var(--rbook-border, #dbe3ed); background: var(--rbook-surface, #fff); padding: 16px; font-size: 14px; line-height: 1.6; }
.heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.goal { font-size: 15px; font-weight: 600; margin: 0; }
.instruction { margin: 4px 0 14px; color: var(--rbook-muted, #64748b); font-size: 13px; }
button { font: inherit; color: inherit; background: transparent; border: 1px solid var(--rbook-border, #dbe3ed); border-radius: 0; padding: 8px 12px; min-height: 44px; cursor: pointer; flex-shrink: 0; }
button:hover { background: var(--rbook-surface-muted, #f1f5f9); }
button:focus-visible { outline: 2px solid var(--rbook-accent, #0369a1); outline-offset: 3px; }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 0; border-block: 1px solid var(--rbook-border, #dbe3ed); padding: 10px 0; }
.stats div { padding-inline: 12px; border-right: 1px solid var(--rbook-border, #dbe3ed); }
.stats div:first-child { padding-left: 0; }
.stats div:last-child { border-right: 0; }
dt { font-size: 12px; color: var(--rbook-muted, #64748b); }
dd { margin: 2px 0 0; font-size: 21px; line-height: 1.3; font-weight: 500; font-variant-numeric: tabular-nums; }
.stage { background: #F2F2F2; margin-top: 14px; }
svg { display: block; width: 100%; height: auto; color-scheme: light; }
.edge { cursor: pointer; touch-action: manipulation; outline: none; }
.edge-line { fill: none; stroke: #888; stroke-width: 1.6; pointer-events: none; }
.edge[data-selected=true] .edge-line { stroke: #222; stroke-width: 3.5; }
.edge[data-cycle=true] .edge-line { stroke: #a4322b; stroke-width: 3.5; }
.edge[data-blocked=true] .edge-line { stroke: #a4322b; stroke-width: 3.5; stroke-dasharray: 8 5; }
.focus-line { fill: none; stroke: #0369a1; stroke-width: 8; opacity: 0; pointer-events: none; }
.edge:focus-visible .focus-line { opacity: .35; }
.hit { fill: none; stroke: transparent; stroke-width: 44; pointer-events: stroke; }
.weight-box { fill: #F2F2F2; stroke: none; }
.edge:hover .weight-box { stroke: #777; stroke-width: 1; }
.weight { fill: #333; font-size: 21px; text-anchor: middle; dominant-baseline: central; }
.edge[data-selected=true] .weight { font-weight: 650; }
.edge[data-blocked=true] .weight { fill: #a4322b; font-weight: 650; }
.node circle { fill: #F2F2F2; stroke: #222; stroke-width: 1.6; }
.node text { fill: #222; font-size: 22px; font-weight: 500; text-anchor: middle; dominant-baseline: central; pointer-events: none; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 20px; color: var(--rbook-muted, #64748b); font-size: 12px; margin: 10px 0; }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.swatch { width: 24px; border-top: 1.6px solid currentColor; }
.swatch.selected { border-top-width: 3.5px; }
.swatch.rejected { border-top: 2px dashed currentColor; }
.status { min-height: 46px; margin: 12px 0 0; padding-left: 9px; border-left: 2px solid transparent; }
.status[data-kind=cycle] { color: var(--rbook-danger-text, #991b1b); border-left-color: currentColor; }
.status[data-kind=complete] { font-weight: 600; }
.complete { display: inline-block; font-size: 12px; font-weight: 500; border-bottom: 1px solid currentColor; margin-left: 10px; }
.complete[hidden] { display: none; }
.keyboard-hint { font-size: 12px; color: var(--rbook-muted, #64748b); margin: 4px 0 0; }
@media (max-width: 480px) { .game { padding: 12px; } .complete { display: block; margin-left: 0; width: fit-content; } .stats div { padding-inline: 9px; } }
`

function svgElement<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string> = {}): SVGElementTagNameMap[K] {
    const element = document.createElementNS(SVG_NS, tag)
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
    return element
}

export function mount(context: AnimationContext): void {
    const style = document.createElement('style')
    style.textContent = STYLES
    const shell = document.createElement('section')
    shell.className = 'game'
    shell.setAttribute('aria-label', '生成树选边练习')
    shell.innerHTML = `
      <div class="heading"><p class="goal">用 4 条边连接全部 5 个顶点<span class="complete" hidden>已完成</span></p><button type="button" class="reset">重新开始</button></div>
      <p class="instruction">点击边或边权选中，再次点击取消。这里先练连通与无环。</p>
      <dl class="stats"><div><dt>已选边</dt><dd data-stat="edges"></dd></div><div><dt>连通块</dt><dd data-stat="components"></dd></div><div><dt>总权值</dt><dd data-stat="weight"></dd></div></dl>
      <div class="stage"></div>
      <div class="legend"><span><i class="swatch"></i>未选边</span><span><i class="swatch selected"></i>已选边</span><span><i class="swatch rejected"></i>成环时拒绝的边</span></div>
      <p class="status" role="status" aria-live="polite" aria-atomic="true"></p>
      <p class="keyboard-hint">也可用 Tab 聚焦边，按 Enter 或空格操作。</p>
    `
    context.root.append(style, shell)

    const graph = svgElement('svg', { role: 'group', 'aria-label': '五点八边无向图，边和边权均可点击' })
    const paper = svgElement('rect', { x: '0', y: '0', fill: '#F2F2F2', stroke: 'none' })
    graph.append(paper)
    const edgeViews = GAME_EDGES.map(edge => {
        const group = svgElement('g', { class: 'edge', tabindex: '0', role: 'button', 'data-edge-id': String(edge.id) })
        const focus = svgElement('path', { class: 'focus-line', 'vector-effect': 'non-scaling-stroke' })
        const line = svgElement('path', { class: 'edge-line', 'vector-effect': 'non-scaling-stroke' })
        const hit = svgElement('path', { class: 'hit', 'vector-effect': 'non-scaling-stroke' })
        const label = svgElement('g')
        const box = svgElement('rect', { class: 'weight-box', x: '-21', y: '-18', width: '42', height: '36' })
        const weight = svgElement('text', { class: 'weight' })
        weight.textContent = String(edge.weight)
        label.append(box, weight)
        group.append(focus, line, hit, label)
        graph.append(group)
        return { edge, group, focus, line, hit, label }
    })
    // 节点最后绘制，遮住边的端点；点击节点本身不操作任何边。
    const nodeViews = Array.from({ length: VERTEX_COUNT }, (_, i) => {
        const group = svgElement('g', { class: 'node' })
        const circle = svgElement('circle')
        const label = svgElement('text')
        label.textContent = String(i + 1)
        group.append(circle, label)
        graph.append(group)
        return { group, circle }
    })
    shell.querySelector('.stage')!.append(graph)

    const edgeCount = shell.querySelector<HTMLElement>('[data-stat=edges]')!
    const components = shell.querySelector<HTMLElement>('[data-stat=components]')!
    const weight = shell.querySelector<HTMLElement>('[data-stat=weight]')!
    const complete = shell.querySelector<HTMLElement>('.complete')!
    const status = shell.querySelector<HTMLElement>('.status')!
    const reset = shell.querySelector<HTMLButtonElement>('.reset')!
    let selected: ReadonlySet<number> = new Set()
    let blocked: number | null = null
    let cycle = new Set<number>()
    let timer: number | undefined

    function render(): void {
        const stats = selectionStats(selected)
        edgeCount.textContent = `${stats.edgeCount} / ${VERTEX_COUNT - 1}`
        components.textContent = String(stats.components)
        weight.textContent = String(stats.weight)
        complete.hidden = !stats.complete
        for (const view of edgeViews) {
            const kept = selected.has(view.edge.id)
            view.group.dataset.selected = String(kept)
            view.group.dataset.cycle = String(cycle.has(view.edge.id))
            view.group.dataset.blocked = String(blocked === view.edge.id)
            view.group.setAttribute('aria-pressed', String(kept))
            view.group.setAttribute('aria-label', `边 ${view.edge.u}—${view.edge.v}，权值 ${view.edge.weight}，${kept ? '已选中，再次操作取消' : '未选中，操作选择'}`)
        }
    }

    function clearFlash(): void {
        window.clearTimeout(timer)
        timer = undefined
        blocked = null
        cycle = new Set()
    }

    function activate(edgeId: number): void {
        clearFlash()
        const move = toggleGameEdge(selected, edgeId)
        selected = move.selected
        const stats = selectionStats(selected)
        if (move.kind === 'cycle') {
            blocked = edgeId
            cycle = new Set(move.path!.edges)
            status.dataset.kind = 'cycle'
            status.textContent = `未加入边 ${move.edge.u}—${move.edge.v}：已有路径 ${move.path!.nodes.join(' → ')}，加入后会形成环。`
            timer = window.setTimeout(() => {
                clearFlash()
                render()
            }, FLASH_MS)
        }
        else if (stats.complete) {
            status.dataset.kind = 'complete'
            status.textContent = '全部 5 个顶点已连通，得到一棵生成树。可以取消边，继续尝试不同的选法。'
        }
        else {
            status.dataset.kind = 'normal'
            status.textContent = move.kind === 'removed'
                ? `已取消边 ${move.edge.u}—${move.edge.v}，现在有 ${stats.components} 个连通块。`
                : `已选择边 ${move.edge.u}—${move.edge.v}，连接了两个不同的连通块。`
        }
        render()
    }

    function restart(): void {
        clearFlash()
        selected = new Set()
        status.dataset.kind = 'normal'
        status.textContent = '从任意一条边开始，连接两个不同的连通块。'
        render()
    }

    function targetEdge(event: Event): number | null {
        const target = event.target
        if (!(target instanceof Element)) return null
        const group = target.closest<SVGGElement>('[data-edge-id]')
        return group ? Number(group.dataset.edgeId) : null
    }
    function onClick(event: MouseEvent): void {
        const edgeId = targetEdge(event)
        if (edgeId !== null) activate(edgeId)
    }
    function onKeydown(event: KeyboardEvent): void {
        const edgeId = targetEdge(event)
        if (edgeId === null || !['Enter', ' '].includes(event.key)) return
        event.preventDefault()
        if (!event.repeat) activate(edgeId)
    }

    function layout(): void {
        const compact = shell.clientWidth < 480
        const width = compact ? 360 : 640
        const height = compact ? 350 : 360
        const left = compact ? 54 : 100, right = width - left
        const top = 60, bottom = height - 60, middle = height / 2
        const nodes = [[0, 0], [left, top], [right, top], [width / 2, middle], [right, bottom], [left, bottom]]
        graph.setAttribute('viewBox', `0 0 ${width} ${height}`)
        graph.setAttribute('width', String(width))
        graph.setAttribute('height', String(height))
        paper.setAttribute('width', String(width))
        paper.setAttribute('height', String(height))
        for (const view of edgeViews) {
            const [x1, y1] = nodes[view.edge.u], [x2, y2] = nodes[view.edge.v]
            const d = `M${x1} ${y1}L${x2} ${y2}`
            for (const path of [view.focus, view.line, view.hit]) path.setAttribute('d', d)
            view.label.setAttribute('transform', `translate(${(x1 + x2) / 2} ${(y1 + y2) / 2})`)
        }
        nodeViews.forEach((view, i) => {
            view.group.setAttribute('transform', `translate(${nodes[i + 1].join(' ')})`)
            view.circle.setAttribute('r', compact ? '20' : '22')
        })
    }

    graph.addEventListener('click', onClick)
    graph.addEventListener('keydown', onKeydown)
    reset.addEventListener('click', restart)
    const observer = new ResizeObserver(layout)
    observer.observe(shell)
    layout()
    restart()
    context.onCleanup(() => {
        clearFlash()
        observer.disconnect()
        graph.removeEventListener('click', onClick)
        graph.removeEventListener('keydown', onKeydown)
        reset.removeEventListener('click', restart)
    })
}
