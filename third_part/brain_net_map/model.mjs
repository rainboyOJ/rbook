export const VIEWS = [
    { id: 'network', title: '知识网络', subtitle: '自由探索文章之间的联系', kind: 'relations' },
    { id: 'dagre', title: '学习路线', subtitle: '前置知识 → 后续文章', kind: 'relations' },
    { id: 'groups', title: '章节分组', subtitle: '按章节聚集，查看跨章联系', kind: 'relations' },
    { id: 'radial', title: '中心辐射', subtitle: '围绕一篇文章探索关联', kind: 'relations' },
    { id: 'mindmap', title: '章节脑图', subtitle: '目录层级 · 向两侧展开', kind: 'directory' },
    { id: 'outline', title: '展开阅读', subtitle: '目录层级 · 可折叠卡片', kind: 'directory' },
]

// Keep every article, including isolates. Only direct external neighbours are added.
export function chapterView(data, chapter = 'all') {
    const own = new Set(data.nodes.filter(n => chapter === 'all' || n.chapter === chapter).map(n => n.id))
    const ids = new Set(own)
    for (const e of data.edges) if (own.has(e.from) || own.has(e.to)) { ids.add(e.from); ids.add(e.to) }
    return {
        nodes: data.nodes.filter(n => ids.has(n.id)),
        edges: data.edges.filter(e => ids.has(e.from) && ids.has(e.to)),
    }
}

export function centreNode(nodes, edges, selected) {
    if (nodes.some(n => n.id === selected)) return selected
    const degree = new Map(nodes.map(n => [n.id, 0]))
    for (const e of edges) {
        if (degree.has(e.from)) degree.set(e.from, degree.get(e.from) + 1)
        if (degree.has(e.to)) degree.set(e.to, degree.get(e.to) + 1)
    }
    return nodes.reduce((best, n) => !best || degree.get(n.id) > degree.get(best) ? n.id : best, null)
}

// Directory edges are navigation structure, never inferred prerequisites.
export function directoryView(data, articles, collapsed = new Set()) {
    const dirs = new Map(data.directories.map(d => [d.id, d]))
    const needed = new Set(['@book'])
    for (const article of articles) {
        let id = article.directory
        while (id && !needed.has(id)) { needed.add(id); id = dirs.get(id)?.parent }
    }
    const nodes = [
        ...data.directories.filter(d => needed.has(d.id)).map(d => ({ ...d, kind: 'directory' })),
        ...articles.map(n => ({ ...n, parent: n.directory, kind: 'article' })),
    ]
    const children = new Map(nodes.map(n => [n.id, []]))
    for (const n of nodes) if (n.parent && children.has(n.parent)) children.get(n.parent).push(n.id)
    const visible = new Set()
    function visit(id) {
        visible.add(id)
        if (!collapsed.has(id)) for (const child of children.get(id) || []) visit(child)
    }
    visit('@book')
    return {
        nodes: nodes.filter(n => visible.has(n.id)).map(n => ({ ...n,
            children: collapsed.has(n.id) ? [] : children.get(n.id),
            childCount: children.get(n.id).length,
            collapsed: collapsed.has(n.id),
        })),
        edges: nodes.filter(n => visible.has(n.id) && n.parent && visible.has(n.parent))
            .map(n => ({ from: n.parent, to: n.id })),
    }
}

export function revealDirectory(data, id, collapsed) {
    const article = data.nodes.find(n => n.id === id)
    const dirs = new Map(data.directories.map(d => [d.id, d]))
    let parent = article?.directory
    while (parent) { collapsed.delete(parent); parent = dirs.get(parent)?.parent }
}

// Pack disconnected DAG components without changing positions within each component.
// Otherwise isolates form a single very tall rank and make every label unreadable.
export function packComponents(nodes, edges, positions, aspect = 1.6) {
    const neighbours = new Map(nodes.map(n => [n.id, []]))
    for (const e of edges) {
        neighbours.get(e.from)?.push(e.to)
        neighbours.get(e.to)?.push(e.from)
    }
    const visited = new Set(), components = []
    for (const n of nodes) {
        if (visited.has(n.id)) continue
        const ids = [], pending = [n.id]; visited.add(n.id)
        while (pending.length) {
            const id = pending.pop(); ids.push(id)
            for (const next of neighbours.get(id)) if (!visited.has(next)) { visited.add(next); pending.push(next) }
        }
        const xs = ids.map(id => positions[id][0]), ys = ids.map(id => positions[id][1])
        const minX = Math.min(...xs) - 100, minY = Math.min(...ys) - 38
        components.push({ ids, minX, minY, width: Math.max(...xs) + 100 - minX, height: Math.max(...ys) + 38 - minY })
    }
    components.sort((a, b) => b.height - a.height || b.width - a.width)
    const area = components.reduce((sum, c) => sum + (c.width + 45) * (c.height + 45), 0)
    const targetWidth = Math.max(...components.map(c => c.width), Math.sqrt(area * aspect))
    const result = {}; let x = 0, y = 0, rowHeight = 0
    for (const c of components) {
        if (x && x + c.width > targetWidth) { x = 0; y += rowHeight + 45; rowHeight = 0 }
        for (const id of c.ids) result[id] = [positions[id][0] - c.minX + x, positions[id][1] - c.minY + y]
        x += c.width + 45; rowHeight = Math.max(rowHeight, c.height)
    }
    return result
}
