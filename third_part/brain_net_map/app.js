import { Graph } from '@antv/g6'
import './style.css'
import { VIEWS, chapterView, centreNode, directoryView, revealDirectory, packComponents } from './model.mjs'

const data = RELATION_DATA
const byId = new Map(data.nodes.map(n => [n.id, n]))
const chapters = new Map(data.chapters.map(c => [c.id, c.title]))
const $ = id => document.getElementById(id)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const motion = reduced ? false : { duration: 380 }
const accent = '#24695c'
const collapsed = new Set()
let chapter = 'all', mode = 'network', selected = null, shown, scope, busy = false
let graph, queue = Promise.resolve(), directoryInitialized = false
const viewInfo = () => VIEWS.find(v => v.id === mode)
const directoryMode = () => viewInfo().kind === 'directory'
const cards = () => ['dagre', 'outline'].includes(mode)
const el = (tag, text, className) => {
    const item = document.createElement(tag)
    if (text != null) item.textContent = text
    if (className) item.className = className
    return item
}

for (const c of data.chapters) $('chapter').append(new Option(c.title, c.id))
for (const v of VIEWS) $('layout').append(new Option(v.title, v.id))
function run(action) {
    queue = queue.then(async () => {
        busy = true
        for (const item of document.querySelectorAll('.toolbar select, .zoom-tools button')) item.disabled = true
        try { await action(); $('error').hidden = true }
        catch (error) { console.error('Knowledge map:', error); $('error').hidden = false }
        finally {
            busy = false; $('loading').hidden = true
            for (const item of document.querySelectorAll('.toolbar select, .zoom-tools button')) item.disabled = false
        }
    })
    return queue
}
function layoutOptions() {
    // Compute the bounded simulation once, then animate the final positions together.
    const common = { animation: false }
    switch (mode) {
        case 'network': return { ...common, type: 'force-atlas2', iterations: 180, maxIteration: 180, prune: false, preventOverlap: true, nodeSize: 58, kr: 28, kg: 2 }
        case 'dagre': return { ...common, type: 'antv-dagre', rankdir: 'LR', nodesep: 24, ranksep: 95, nodeSize: [176, 48] }
        case 'groups': return { ...common, type: 'combo-combined', comboPadding: 32, nodeSize: 64, nodeSpacing: 26, comboSpacing: 70,
            layout: id => id ? { type: 'grid', nodeSize: 75, nodeSpacing: 35, cols: 4, preventOverlap: true } : { type: 'grid', cols: 4, preventOverlap: true, nodeSpacing: 100 } }
        case 'radial': return { ...common, type: 'radial', focusNode: centreNode(scope.nodes, scope.edges, selected), unitRadius: 160, nodeSize: 68, nodeSpacing: 20, preventOverlap: true, maxIteration: 250 }
        case 'mindmap': return { ...common, type: 'mindmap', direction: 'H', getHeight: () => 30, getWidth: () => 160, getVGap: () => 10, getHGap: () => 55 }
        case 'outline': return { ...common, type: 'indented', direction: 'LR', indent: 240, getHeight: () => 70, dropCap: false }
    }
}
function graphOptions() {
    return {
        layout: layoutOptions(),
        node: {
            type: () => cards() ? 'rect' : 'circle',
            style: {
                size: d => cards() ? [176, 48] : mode === 'mindmap' ? (d.data.kind === 'directory' ? 6 : 3) : 13,
                radius: 2,
                fill: d => cards() ? '#ffffff' : d.data.external ? '#c6d1c9' : d.data.kind === 'directory' ? accent : '#607a69',
                stroke: d => d.data.external ? '#bac9be' : cards() ? '#bac9bf' : '#f7f8f6',
                lineWidth: cards() ? 1 : 2,
                lineDash: d => d.data.external && cards() ? [4, 3] : undefined,
                labelText: d => `${d.data.kind === 'directory' ? (d.data.collapsed ? '▸ ' : '▾ ') : ''}${d.data.label || d.data.title}${d.data.kind === 'directory' ? `  ${d.data.childCount}` : ''}${d.data.external ? ' · 跨章' : ''}`,
                labelPlacement: cards() ? 'center' : 'bottom',
                labelOffsetY: cards() ? 0 : 7,
                labelFontSize: () => 11 / Math.min(1, graph?.rendered ? graph.getZoom() : 1),
                labelFontFamily: 'system-ui, sans-serif',
                labelFill: d => d.data.external ? '#7d8c82' : '#3e5346',
                labelFontWeight: d => d.data.kind === 'directory' ? 600 : 400,
                labelWordWrap: true,
                labelMaxWidth: () => cards() ? 155 : 145 / Math.min(1, graph?.rendered ? graph.getZoom() : 1),
                labelMaxLines: 2,
                labelTextOverflow: 'ellipsis',
                labelBackground: !cards(),
                labelBackgroundFill: '#f7f8f6',
                labelBackgroundFillOpacity: .9,
                cursor: 'pointer',
            },
            state: {
                selected: { stroke: accent, lineWidth: 2, fill: cards() ? '#edf5ef' : accent, labelFill: accent, labelFontWeight: 650, labelVisibility: 'visible', halo: true, haloStroke: accent, haloLineWidth: 7, haloStrokeOpacity: .12 },
                related: { stroke: accent, labelFill: accent, labelVisibility: 'visible' },
                dim: { opacity: .18 },
            },
        },
        edge: {
            type: mode === 'dagre' ? 'polyline' : directoryMode() ? 'cubic-horizontal' : 'line',
            style: { stroke: '#a8bbae', lineWidth: 1.2, opacity: .85, endArrow: !directoryMode(), endArrowSize: 5, radius: 8,
                router: mode === 'dagre' ? { type: 'orth', padding: 18 } : false, controlPoints: [] },
            state: { active: { stroke: accent, lineWidth: 1.8, opacity: 1 }, dim: { opacity: .1 } },
        },
        combo: { type: 'rect', style: { padding: [38, 24, 24, 24], radius: 5, fill: '#eaf0e9', fillOpacity: .35, stroke: '#cdd9ce', lineWidth: 1,
            labelText: d => d.data.title, labelPlacement: 'top', labelFontSize: () => 12 / Math.min(1, graph?.rendered ? graph.getZoom() : 1), labelFontWeight: 550, labelFill: '#506f59' } },
        behaviors: ['drag-canvas', { type: 'zoom-canvas', sensitivity: .8, animation: reduced ? false : { duration: 120 } },
            { type: 'drag-element', dropEffect: 'none', animation: false },
            ...(!cards() ? [{ type: 'auto-adapt-label', key: 'labels', padding: 5, throttle: 64, sortNode: (a, b) => a?.id === selected ? -1 : b?.id === selected ? 1 : 0 }] : [])],
    }
}
function mapData() {
    const comboIds = new Set(shown.nodes.map(n => n.chapter))
    return {
        nodes: shown.nodes.map((n, i) => ({
            id: n.id, children: n.children || [],
            ...(mode === 'groups' ? { combo: `@combo:${n.chapter}` } : {}),
            data: { ...n, kind: n.kind || 'article', external: chapter !== 'all' && n.chapter && n.chapter !== chapter },
            // A deterministic seed gives the initial force layout a repeatable starting point.
            style: { x: Math.cos(i * 2.39996) * Math.sqrt(i + 1) * 30, y: Math.sin(i * 2.39996) * Math.sqrt(i + 1) * 30 },
        })),
        edges: shown.edges.map(e => ({ id: JSON.stringify([e.from, e.to]), source: e.from, target: e.to })),
        combos: mode === 'groups' ? [...comboIds].map(id => ({ id: `@combo:${id}`, data: { title: chapters.get(id) } })) : [],
    }
}
async function rebuild({ fit = true } = {}) {
    $('loading').hidden = false; $('tooltip').hidden = true
    scope = chapterView(data, chapter)
    shown = directoryMode() ? directoryView(data, scope.nodes, collapsed) : scope
    const options = graphOptions()
    if (!graph) {
        graph = new Graph({ container: 'graph', autoResize: true, padding: [220, 70, 90, 70], zoomRange: [.025, 5], animation: motion,
            data: mapData(), ...options })
        bindGraph()
    } else {
        // Keep prior positions as animation origins when changing layout.
        const next = mapData(), previous = new Map(graph.getNodeData().map(n => [n.id, n.style]))
        for (const n of next.nodes) if (mode !== 'network' && previous.has(n.id)) n.style = { x: previous.get(n.id).x, y: previous.get(n.id).y }
        graph.setData(next)
        graph.setOptions(options)
    }
    const origins = Object.fromEntries(graph.getNodeData().map(n => [n.id, [n.style.x, n.style.y]]))
    await graph.render()
    let targets = Object.fromEntries(graph.getNodeData().map(n => [n.id, graph.getElementPosition(n.id)]))
    if (mode === 'dagre') targets = packComponents(shown.nodes, shown.edges, targets, $('graph').clientWidth / $('graph').clientHeight)
    if (mode === 'dagre') await graph.translateElementTo(targets, false)
    if (fit) await graph.fitView({}, false)
    if (!reduced) {
        await graph.translateElementTo(origins, false)
        $('loading').hidden = true
        await graph.translateElementTo(targets, true)
    }
    if (fit) {
        await graph.fitView({}, motion)
        // Large card graphs stay readable on entry; Fit remains an explicit full overview.
        if (cards() && graph.getZoom() < .55) {
            await graph.zoomTo(.55, motion)
            const anchor = shown.nodes.some(n => n.id === selected) ? selected : directoryMode() ? '@book' : centreNode(scope.nodes, scope.edges)
            if (anchor) await graph.focusElement(anchor, motion)
        }
    }
    await highlight()
    await refreshLabels()
    renderDetail(); updateCaption(); updateZoom()
}
function updateCaption() {
    $('kind').textContent = directoryMode() ? '目录层级' : '前置关系'
    $('view-title').textContent = viewInfo().title
    $('view-description').textContent = viewInfo().subtitle
    const external = scope.nodes.filter(n => chapter !== 'all' && n.chapter !== chapter).length
    $('counts').textContent = `${chapter === 'all' ? '全书' : chapters.get(chapter)} · ${scope.nodes.length} 篇文章${external ? `（含 ${external} 篇跨章）` : ''}${directoryMode() ? ` · ${shown.nodes.length} 个可见节点` : ` · ${scope.edges.length} 条关系`}`
    $('legend').textContent = directoryMode() ? '连线：目录归属 · 分支可折叠' : '箭头：前置知识 → 后续文章'
}
async function highlight() {
    if (!graph) return
    const related = new Set(selected ? [selected] : [])
    for (const e of shown.edges) if (e.from === selected || e.to === selected) { related.add(e.from); related.add(e.to) }
    const states = {}
    for (const n of shown.nodes) states[n.id] = !selected ? [] : n.id === selected ? ['selected'] : related.has(n.id) ? ['related'] : ['dim']
    for (const e of shown.edges) states[JSON.stringify([e.from, e.to])] = !selected ? [] : e.from === selected || e.to === selected ? ['active'] : ['dim']
    await graph.setElementState(states, false)
}
function choice(node) {
    const button = el('button', node.title, 'article-choice')
    if (node.chapter) button.append(el('small', chapters.get(node.chapter)))
    button.onclick = () => run(() => choose(node.id, true))
    return button
}
function renderDetail() {
    const panel = $('detail-content'), node = byId.get(selected) || data.directories.find(d => d.id === selected)
    $('detail').hidden = !node
    if (!node) { panel.replaceChildren(); return }
    panel.replaceChildren(el('p', byId.has(selected) ? chapters.get(node.chapter) : '目录导航', 'eyebrow'), el('h2', node.title))
    if (byId.has(selected)) {
        const read = el('a', '阅读文章 ↗', 'read-link'); read.href = node.href; panel.append(read)
        if (directoryMode()) panel.append(el('p', '当前画布展示目录层级；以下为文章声明的前置与后续关系。', 'muted'))
        for (const [title, ids] of [
            ['前置知识', data.edges.filter(e => e.to === selected).map(e => e.from)],
            ['后续文章', data.edges.filter(e => e.from === selected).map(e => e.to)],
        ]) {
            const section = el('section', null, 'detail-section'); section.append(el('h3', `${title} · ${ids.length}`))
            if (!ids.length) section.append(el('p', '尚未配置', 'muted'))
            for (const id of ids) section.append(choice(byId.get(id)))
            panel.append(section)
        }
        if (!data.edges.some(e => e.from === selected || e.to === selected)) panel.append(el('p', '没有已声明的连线，不代表没有前置知识。', 'muted'))
        if (mode === 'radial') {
            const centre = el('button', '以此文章为中心', 'detail-action')
            centre.onclick = () => run(() => rebuild())
            panel.append(centre)
        }
    } else {
        const children = directoryView(data, scope.nodes).nodes.filter(n => n.parent === selected)
        const section = el('section', null, 'detail-section'); section.append(el('h3', '目录内容'))
        for (const child of children) section.append(choice(child))
        panel.append(section)
        const toggle = el('button', collapsed.has(selected) ? '展开此分支' : '折叠此分支', 'detail-action')
        toggle.setAttribute('aria-expanded', String(!collapsed.has(selected)))
        toggle.onclick = () => run(() => toggleBranch(selected))
        panel.append(toggle)
    }
}
async function choose(id, locate = false) {
    selected = id
    if (byId.has(id) && !scope.nodes.some(n => n.id === id)) {
        chapter = byId.get(id).chapter; $('chapter').value = chapter
        if (directoryMode()) revealDirectory(data, id, collapsed)
        await rebuild()
    } else if (directoryMode() && !shown.nodes.some(n => n.id === id)) {
        if (byId.has(id)) revealDirectory(data, id, collapsed)
        else {
            const dirs = new Map(data.directories.map(d => [d.id, d])); let parent = dirs.get(id)?.parent
            while (parent) { collapsed.delete(parent); parent = dirs.get(parent)?.parent }
        }
        await rebuild({ fit: false })
    } else { await highlight(); renderDetail() }
    if (locate && shown.nodes.some(n => n.id === id)) {
        await graph.zoomTo(Math.max(graph.getZoom(), cards() ? .8 : 1.2), motion)
        await graph.focusElement(id, motion)
        if (matchMedia('(max-width: 560px)').matches && !$('detail').hidden) {
            const canvasRect = $('graph').getBoundingClientRect()
            const panelTop = $('detail').getBoundingClientRect().top
            const targetY = (document.querySelector('.toolbar').getBoundingClientRect().bottom + panelTop) / 2
            const currentY = graph.getViewportByCanvas(graph.getElementPosition(id))[1] + canvasRect.top
            await graph.translateBy([0, targetY - currentY], motion)
        }
    }
    $('announcement').textContent = `已选择：${byId.get(id)?.title || data.directories.find(d => d.id === id)?.title}`
    updateZoom()
}
async function toggleBranch(id) {
    if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id)
    await rebuild({ fit: false })
    await graph.focusElement(id, motion)
}
async function refreshLabels() {
    if (!graph?.rendered) return
    // G6 caches mapped styles; invalidate the mapper after zoom so labels keep
    // their reading size instead of retaining a font calculated at a tiny scale.
    const options = graphOptions()
    graph.setNode(options.node)
    if (mode === 'groups') graph.setCombo(options.combo)
    await graph.draw()
    if (!cards()) graph.updateBehavior({ key: 'labels', padding: 5 })
}
function updateZoom() { if (graph?.rendered) $('zoom').textContent = `${Math.round(graph.getZoom() * 100)}%` }
function tooltip(id) {
    const node = shown.nodes.find(n => n.id === id)
    if (!node || busy) return
    const tip = $('tooltip')
    tip.replaceChildren(el('span', node.title), el('small', node.kind === 'directory' ? '目录 · 双击展开或折叠' : `${chapters.get(node.chapter)} · 双击阅读`))
    const [x, y] = graph.getViewportByCanvas(graph.getElementPosition(id))
    tip.style.left = `${Math.max(12, Math.min(x + 14, $('workspace').clientWidth - 260))}px`
    tip.style.top = `${Math.max(12, Math.min(y + 20, $('workspace').clientHeight - 80))}px`
    tip.hidden = false
}
function bindGraph() {
    graph.on('node:click', event => { if (!busy) run(() => choose(event.target.id)) })
    graph.on('node:dblclick', event => {
        const id = event.target.id
        if (byId.has(id)) location.assign(byId.get(id).href)
        else if (!busy) run(() => toggleBranch(id))
    })
    graph.on('canvas:click', () => { if (!busy) run(async () => { selected = null; await highlight(); renderDetail() }) })
    graph.on('node:pointerenter', event => tooltip(event.target.id))
    graph.on('node:pointerleave', () => { $('tooltip').hidden = true })
    let labelTimer
    graph.on('aftertransform', () => {
        updateZoom(); $('tooltip').hidden = true
        clearTimeout(labelTimer)
        labelTimer = setTimeout(() => { if (!busy) run(refreshLabels) }, 100)
    })
}
$('chapter').onchange = () => run(async () => {
    chapter = $('chapter').value
    if (byId.has(selected) && !chapterView(data, chapter).nodes.some(n => n.id === selected)) selected = null
    if (!byId.has(selected)) selected = null
    if (directoryMode()) {
        collapsed.clear()
        if (chapter === 'all') for (const d of data.directories) if (d.parent === '@book') collapsed.add(d.id)
        if (selected) revealDirectory(data, selected, collapsed)
    }
    await rebuild()
})
$('layout').onchange = () => run(async () => {
    mode = $('layout').value
    if (directoryMode() && !directoryInitialized) {
        if (chapter === 'all') for (const d of data.directories) if (d.parent === '@book') collapsed.add(d.id)
        directoryInitialized = true
    }
    if (!directoryMode() && !byId.has(selected)) selected = null
    if (directoryMode() && selected) revealDirectory(data, selected, collapsed)
    await rebuild()
})
$('zoom-in').onclick = () => run(async () => { await graph.zoomTo(Math.min(5, graph.getZoom() * 1.3), motion); updateZoom() })
$('zoom-out').onclick = () => run(async () => { await graph.zoomTo(Math.max(.025, graph.getZoom() / 1.3), motion); updateZoom() })
$('fit').onclick = () => run(async () => { await graph.fitView({}, motion); updateZoom() })
$('reset').onclick = () => run(async () => { selected = null; collapsed.clear(); await rebuild() })
$('close-detail').onclick = () => run(async () => { selected = null; await highlight(); renderDetail() })
$('retry').onclick = () => location.reload()
function closeSearch() { $('results').hidden = true; $('search').setAttribute('aria-expanded', 'false') }
function search() {
    const query = $('search').value.trim().toLocaleLowerCase()
    if (!query) return closeSearch()
    const matches = data.nodes.filter(n => [n.title, n.label, n.id, chapters.get(n.chapter)].join(' ').toLocaleLowerCase().includes(query))
    $('results').replaceChildren(el('p', matches.length ? `找到 ${matches.length} 篇文章` : '没有找到文章，试试其他关键词。'))
    for (const node of matches) {
        const button = choice(node)
        button.onclick = () => { $('search').focus(); closeSearch(); run(() => choose(node.id, true)) }
        $('results').append(button)
    }
    $('results').hidden = false; $('search').setAttribute('aria-expanded', 'true')
}
$('search').oninput = search
$('search').onfocus = search
$('search').onkeydown = event => {
    if (event.key === 'ArrowDown' && !$('results').hidden) { event.preventDefault(); $('results').querySelector('button')?.focus() }
    if (event.key === 'Escape') closeSearch()
}
$('results').onkeydown = event => {
    const buttons = [...$('results').querySelectorAll('button')], i = buttons.indexOf(document.activeElement)
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); buttons[Math.max(0, Math.min(buttons.length - 1, i + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus() }
    if (event.key === 'Escape') { $('search').focus(); closeSearch() }
}
document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) closeSearch() })
$('graph').onkeydown = event => {
    if (event.key === 'Escape') $('close-detail').click()
    if (event.key === '+' || event.key === '=') { event.preventDefault(); $('zoom-in').click() }
    if (event.key === '-') { event.preventDefault(); $('zoom-out').click() }
    if (event.key === '0') { event.preventDefault(); $('fit').click() }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault()
        run(() => graph.translateBy([event.key === 'ArrowLeft' ? 80 : event.key === 'ArrowRight' ? -80 : 0, event.key === 'ArrowUp' ? 80 : event.key === 'ArrowDown' ? -80 : 0], motion))
    }
}
// Handle native two-finger zoom explicitly; the wheel behavior does not cover
// touch input consistently. Capture moves before G6's single-finger dragging.
const touchPoints = new Map()
let pinch = null
const pinchGeometry = () => {
    const [a, b] = [...touchPoints.values()]
    const rect = $('graph').getBoundingClientRect()
    return { distance: Math.hypot(a.x - b.x, a.y - b.y),
        centre: [(a.x + b.x) / 2 - rect.x, (a.y + b.y) / 2 - rect.y] }
}
$('graph').addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touchPoints.size === 2 && graph?.rendered && !busy) {
        pinch = { ...pinchGeometry(), zoom: graph.getZoom() }
        event.stopImmediatePropagation()
    }
}, true)
$('graph').addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || !touchPoints.has(event.pointerId)) return
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (!pinch) return
    event.preventDefault(); event.stopImmediatePropagation()
    if (touchPoints.size !== 2 || busy) return
    const next = pinchGeometry()
    const zoom = Math.max(.025, Math.min(5, pinch.zoom * next.distance / Math.max(1, pinch.distance)))
    graph.zoomTo(zoom, false, next.centre).then(updateZoom).catch(console.error)
}, { capture: true, passive: false })
function endTouch(event) {
    touchPoints.delete(event.pointerId)
    if (!touchPoints.size) pinch = null
}
$('graph').addEventListener('pointerup', endTouch, true)
$('graph').addEventListener('pointercancel', endTouch, true)
// Development-only handle for browser interaction checks.

if (import.meta.env.DEV) window.__knowledgeMap = () => ({ graph, mode, chapter, selected, shown, busy })
run(() => rebuild())
