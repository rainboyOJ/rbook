const path = require('node:path')
const { loadCatalog } = require('../../.tsbuild/publishing/content/catalog-loader.js')
const { resolveArticleSource } = require('../../.tsbuild/publishing/content/source-resolver.js')
const { PathPolicy } = require('../../.tsbuild/publishing/content/path-policy.js')

function loadRelations() {
    const root = path.resolve(__dirname, '../..')
    const policy = new PathPolicy(root)
    const diagnostics = []
    const catalog = loadCatalog(path.join(policy.book, 'catalog.yaml'), diagnostics)
    const nodes = [], chapters = [], edges = []
    function walk(entries, parent, chapter, hidden = false) {
        for (const entry of entries) {
            const relative = path.posix.join(parent, entry.path || '')
            const excluded = hidden || entry.hidden === true
            if (entry.children) { walk(entry.children, relative, chapter, excluded); continue }
            const { metadata: m, source } = resolveArticleSource(relative, policy.book, diagnostics)
            if (excluded || m.hiden_brain_map || m.hidden_brain_map) continue
            nodes.push({ id: m.id, title: m.title || entry.title, label: m.menuTitle || entry.title,
                chapter, href: policy.publishHref(source.filePath),
                pre: typeof m.pre === 'string' ? [m.pre] : Array.isArray(m.pre) ? m.pre : [] })
        }
    }
    catalog.entries.forEach((entry, i) => {
        const id = String(i)
        chapters.push({ id, title: entry.title })
        walk([entry], '', id)
    })
    const ids = new Set(nodes.map(n => n.id)), seen = new Set()
    for (const n of nodes) for (const from of n.pre) {
        if (!ids.has(from)) { console.warn(`[文章关系] ${n.id} 的前置 ${from} 不在可见文章中`); continue }
        const key = JSON.stringify([from, n.id])
        if (!seen.has(key)) { edges.push({ from, to: n.id }); seen.add(key) }
    }
    if (diagnostics.some(d => d.level === 'error')) throw new Error(JSON.stringify(diagnostics))
    return { nodes, edges, chapters: chapters.filter(c => nodes.some(n => n.chapter === c.id)) }
}
module.exports = () => ({ name: 'article-relations-data', config: () => ({ define: { RELATION_DATA: JSON.stringify(loadRelations()) } }) })
module.exports.loadRelations = loadRelations
