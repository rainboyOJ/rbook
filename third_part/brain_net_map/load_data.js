const path = require('node:path')
const { loadCatalog } = require('../../.tsbuild/publishing/content/catalog-loader.js')
const { resolveArticleSource } = require('../../.tsbuild/publishing/content/source-resolver.js')
const { PathPolicy } = require('../../.tsbuild/publishing/content/path-policy.js')
const { buildLearningEdges, isLearningArticle } = require('../../.tsbuild/publishing/domain/learning-relations.js')

function loadRelations() {
    const root = path.resolve(__dirname, '../..')
    const policy = new PathPolicy(root)
    const diagnostics = []
    const catalog = loadCatalog(path.join(policy.book, 'catalog.yaml'), diagnostics)
    const nodes = [], chapters = []
    const directories = [{ id: '@book', title: '算法电子书', parent: null }]
    function walk(entries, parent, chapter, hidden = false, directory = '@book') {
        for (const entry of entries) {
            const relative = path.posix.join(parent, entry.path || '')
            const excluded = hidden || entry.hidden === true
            if (entry.children) {
                if (excluded) continue
                const id = `@directory:${relative}`
                directories.push({ id, title: entry.title, parent: directory, chapter })
                walk(entry.children, relative, chapter, excluded, id)
                continue
            }
            const { metadata: m, source } = resolveArticleSource(relative, policy.book, diagnostics)
            if (!isLearningArticle(m, excluded)) continue
            nodes.push({ id: m.id, title: m.title || entry.title, label: m.menuTitle || entry.title,
                chapter, directory, href: policy.publishHref(source.filePath),
                pre: typeof m.pre === 'string' ? [m.pre] : Array.isArray(m.pre) ? m.pre : [] })
        }
    }
    catalog.entries.forEach((entry, i) => {
        const id = String(i)
        chapters.push({ id, title: entry.title })
        walk([entry], '', id)
    })
    const edges = buildLearningEdges(nodes, (id, pre) => console.warn(`[文章关系] ${id} 的前置 ${pre} 不在可见文章中`))
    if (diagnostics.some(d => d.level === 'error')) throw new Error(JSON.stringify(diagnostics))
    return { nodes, edges, directories, chapters: chapters.filter(c => nodes.some(n => n.chapter === c.id)) }
}
module.exports = () => ({ name: 'article-relations-data', config: () => ({ define: { RELATION_DATA: JSON.stringify(loadRelations()) } }) })
module.exports.loadRelations = loadRelations
