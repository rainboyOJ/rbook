import './style.css'
import { chapterView, ancestors, layout } from './model.mjs'

const data = RELATION_DATA
const byId = new Map(data.nodes.map(n => [n.id, n]))
const chapters = new Map(data.chapters.map(c => [c.id, c.title]))
const $ = id => document.getElementById(id)
const svgNS = 'http://www.w3.org/2000/svg'
const el = (tag, text, className) => {
    const item = document.createElement(tag)
    if (text != null) item.textContent = text
    if (className) item.className = className
    return item
}
const svg = (tag, attrs = {}) => {
    const item = document.createElementNS(svgNS, tag)
    for (const [key, value] of Object.entries(attrs)) item.setAttribute(key, value)
    return item
}
let chapter = data.chapters.find(c => chapterView(data, c.id).edges.length)?.id ?? data.chapters[0]?.id
let selected = null, expanded = false, zoom = 1, view, geometry
const nodeElements = new Map(), edgeElements = []

for (const c of data.chapters) $('chapter').append(new Option(c.title, c.id))
$('chapter').value = chapter

function choice(node, action = () => select(node.id, true)) {
    const button = el('button', node.title, 'article-choice')
    button.append(el('small', chapters.get(node.chapter)))
    button.addEventListener('click', action)
    return button
}
function renderDetail() {
    const detail = $('detail')
    detail.replaceChildren()
    const node = byId.get(selected)
    if (!node) {
        const placeholder = el('div', null, 'detail-placeholder')
        placeholder.append(el('div', '→', 'placeholder-mark'), el('p', '从一篇文章开始', 'eyebrow'), el('h2', '看清知识的来路'), el('p', '点击图中的文章，查看它需要的前置知识，以及可以继续学习的内容。', 'muted'))
        detail.append(placeholder)
        return
    }
    detail.append(el('p', chapters.get(node.chapter), 'eyebrow'), el('h2', node.title))
    const read = el('a', '阅读文章 ↗', 'read-link')
    read.href = node.href
    detail.append(read)
    for (const [label, ids] of [
        ['前置知识', data.edges.filter(e => e.to === selected).map(e => e.from)],
        ['后续文章', data.edges.filter(e => e.from === selected).map(e => e.to)]
    ]) {
        const section = el('section', null, 'detail-section')
        section.append(el('h3', `${label} · ${ids.length}`))
        if (!ids.length) section.append(el('p', '尚未配置', 'muted'))
        for (const id of ids) section.append(choice(byId.get(id)))
        detail.append(section)
    }
    if (data.edges.some(e => e.to === selected)) {
        const toggle = el('button', expanded ? '收起完整前置链' : '展开完整前置链', 'expand-button')
        toggle.setAttribute('aria-expanded', String(expanded))
        toggle.onclick = () => { expanded = !expanded; renderGraph(); renderDetail(); locate() }
        detail.append(toggle)
    }
    if (geometry.cyclic.has(selected)) detail.append(el('p', '这篇文章存在循环依赖，请核对前置知识配置。', 'muted'))
}
function highlight() {
    const related = expanded ? ancestors(data.edges, selected) : new Set([selected])
    if (!expanded) for (const e of data.edges) if (e.from === selected || e.to === selected) { related.add(e.from); related.add(e.to) }
    for (const [id, group] of nodeElements) {
        group.classList.toggle('selected', id === selected)
        group.classList.toggle('related', id !== selected && related.has(id))
        group.classList.toggle('dim', selected !== null && !related.has(id))
        group.querySelector('button').setAttribute('aria-pressed', String(id === selected))
    }
    for (const { edge, path } of edgeElements) {
        const active = expanded ? related.has(edge.from) && related.has(edge.to) : edge.from === selected || edge.to === selected
        path.classList.toggle('active', active)
        path.classList.toggle('dim', selected !== null && !active)
        path.setAttribute('marker-end', active ? 'url(#arrow-active)' : 'url(#arrow)')
    }
    for (const button of $('isolated-list').children) button.setAttribute('aria-pressed', String(button.dataset.id === selected))
}
function locate() {
    const p = geometry.positions.get(selected)
    if (p) $('viewport').scrollTo(Math.max(0, (p.x + p.width / 2) * zoom - $('viewport').clientWidth / 2), Math.max(0, (p.y + p.height / 2) * zoom - $('viewport').clientHeight / 2))
    else $('unconnected').open = true
}
function select(id, navigate = false) {
    if (!byId.has(id)) return
    const changeChapter = navigate && !view.nodes.some(n => n.id === id) && byId.get(id).chapter !== chapter
    if (selected !== id) expanded = false
    selected = id
    if (changeChapter) { chapter = byId.get(id).chapter; $('chapter').value = chapter; zoom = 1 }
    // Selecting a card never moves existing cards, including an expanded chain.
    // Explicit expansion, chapter changes and reset are the layout actions.
    if (changeChapter) renderGraph()
    else {
        highlight()
        if (!expanded && !geometry.cyclic.size) $('map-hint').textContent = '点击文章查看关系 · 拖动画布浏览'
    }
    renderDetail()
    if (navigate) locate()
    $('announcement').textContent = `已选择：${byId.get(id).title}`
}
function renderGraph() {
    view = chapterView(data, chapter, expanded ? selected : null)
    geometry = layout(view.nodes, view.edges)
    nodeElements.clear(); edgeElements.length = 0
    const graph = $('graph')
    graph.replaceChildren()
    const defs = svg('defs')
    for (const [id, color] of [['arrow', '#b1bcb7'], ['arrow-active', '#24695c']]) {
        const marker = svg('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' })
        marker.append(svg('path', { d: 'M 0 1 L 9 5 L 0 9 z', fill: color }))
        defs.append(marker)
    }
    graph.append(defs)
    for (const edge of view.edges) {
        const a = geometry.positions.get(edge.from), b = geometry.positions.get(edge.to)
        const x1 = a.x + a.width, y1 = a.y + a.height / 2, x2 = b.x, y2 = b.y + b.height / 2
        // Cyclic edges curve outside the cards, instead of crossing their labels.
        const d = a.x === b.x
            ? `M ${x1} ${y1} C ${x1 + 40} ${y1 - 60}, ${x1 + 40} ${y2 + 60}, ${x1} ${y2 + 16}`
            : `M ${x1} ${y1} C ${(x1+x2)/2} ${y1}, ${(x1+x2)/2} ${y2}, ${x2} ${y2}`
        const path = svg('path', { d, class: 'edge', 'marker-end': 'url(#arrow)' })
        graph.append(path); edgeElements.push({ edge, path })
    }
    for (const node of view.nodes) {
        const p = geometry.positions.get(node.id)
        const group = svg('g', { class: 'node', 'data-id': node.id })
        const box = svg('foreignObject', { x: p.x, y: p.y, width: p.width, height: p.height })
        const button = el('button', null, `node-card${node.chapter !== chapter ? ' external' : ''}`)
        button.title = node.title
        button.setAttribute('aria-label', node.title)
        button.append(el('small', `${node.chapter !== chapter ? '跨章节 · ' : ''}${chapters.get(node.chapter)}`), el('strong', node.label || node.title))
        button.onclick = () => select(node.id)
        box.append(button); group.append(box); graph.append(group); nodeElements.set(node.id, group)
    }
    graph.setAttribute('viewBox', `0 0 ${geometry.width} ${geometry.height}`)
    graph.toggleAttribute('hidden', !view.nodes.length)
    $('empty').hidden = !!view.nodes.length
    $('chapter-title').textContent = chapters.get(chapter) || '文章关系'
    $('counts').textContent = `${view.nodes.length} 篇文章 · ${view.edges.length} 条关系`
    $('map-hint').textContent = geometry.cyclic.size ? '存在循环依赖 · 请核对文章配置' : expanded ? '已展开完整前置链' : '点击文章查看关系 · 拖动画布浏览'
    $('isolated-count').textContent = `${view.isolated.length} 篇`
    $('isolated-list').replaceChildren(...view.isolated.map(node => {
        const button = choice(node, () => select(node.id))
        button.dataset.id = node.id
        return button
    }))
    applyZoom(); highlight()
}
function applyZoom() {
    $('graph').setAttribute('width', geometry.width * zoom)
    $('graph').setAttribute('height', geometry.height * zoom)
    $('zoom').textContent = `${Math.round(zoom * 100)}%`
    $('zoom-out').disabled = zoom <= .1
    $('zoom-in').disabled = zoom >= 2
}
function setZoom(value) {
    const viewport = $('viewport'), old = zoom
    const x = viewport.scrollLeft + viewport.clientWidth / 2, y = viewport.scrollTop + viewport.clientHeight / 2
    zoom = Math.max(.1, Math.min(2, value)); applyZoom()
    viewport.scrollTo(x / old * zoom - viewport.clientWidth / 2, y / old * zoom - viewport.clientHeight / 2)
}
$('zoom-in').onclick = () => setZoom(zoom + .2)
$('zoom-out').onclick = () => setZoom(zoom - .2)
$('fit').onclick = () => { setZoom(Math.min($('viewport').clientWidth / geometry.width, $('viewport').clientHeight / geometry.height)); $('viewport').scrollTo(0, 0) }
function reset() { selected = null; expanded = false; zoom = 1; $('unconnected').open = false; renderGraph(); renderDetail(); $('viewport').scrollTo(0, 0) }
$('reset').onclick = reset
$('chapter').onchange = () => { chapter = $('chapter').value; reset() }

function closeSearch() { $('results').hidden = true; $('search').setAttribute('aria-expanded', 'false') }
function search() {
    const query = $('search').value.trim().toLocaleLowerCase()
    if (!query) { closeSearch(); return }
    const matches = data.nodes.filter(n => [n.title, n.label, n.id, chapters.get(n.chapter)].join(' ').toLocaleLowerCase().includes(query))
    $('results').replaceChildren(el('p', matches.length ? `找到 ${matches.length} 篇文章` : '没有找到文章，试试其他标题或关键词。'))
    for (const node of matches) $('results').append(choice(node, () => { select(node.id, true); $('search').focus(); closeSearch() }))
    $('results').hidden = false
    $('search').setAttribute('aria-expanded', 'true')
}
$('search').oninput = search
$('search').onfocus = search
$('search').onkeydown = event => {
    if (event.key === 'ArrowDown' && !$('results').hidden) { event.preventDefault(); $('results').querySelector('button')?.focus() }
    if (event.key === 'Escape') closeSearch()
}
$('results').onkeydown = event => {
    const buttons = [...$('results').querySelectorAll('button')], index = buttons.indexOf(document.activeElement)
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); buttons[Math.max(0, Math.min(buttons.length-1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus() }
    if (event.key === 'Escape') { $('search').focus(); closeSearch() }
}
document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) closeSearch() })
let drag = null
$('viewport').addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button') || event.target === $('viewport')) return
    drag = { x: event.clientX, y: event.clientY, left: $('viewport').scrollLeft, top: $('viewport').scrollTop }
    $('viewport').setPointerCapture(event.pointerId); $('viewport').classList.add('dragging'); event.preventDefault()
})
$('viewport').addEventListener('pointermove', event => {
    if (drag) $('viewport').scrollTo(drag.left + drag.x - event.clientX, drag.top + drag.y - event.clientY)
})
$('viewport').addEventListener('lostpointercapture', () => { drag = null; $('viewport').classList.remove('dragging') })
renderGraph(); renderDetail()
