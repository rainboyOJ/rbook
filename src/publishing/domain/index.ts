import { ArticleIndex, ArticleIndexEntry } from './metadata'
import { Catalog } from './catalog'
import { buildLearningEdges, isLearningArticle, LearningArticle, LearningRelations } from './learning-relations'

export function buildArticleIndex(_catalog: Catalog, entries: ArticleIndexEntry[]): ArticleIndex {
    const byId = new Map<string, ArticleIndexEntry>()
    const bySourcePath = new Map<string, ArticleIndexEntry>()
    const byPublishHref = new Map<string, ArticleIndexEntry>()

    for (const entry of entries) {
        if (entry.id) byId.set(entry.id, entry)
        if (entry.sourcePath) bySourcePath.set(entry.sourcePath, entry)
        if (entry.publishHref) byPublishHref.set(entry.publishHref, entry)
    }

    const visible = [...byId.values()].filter(entry => isLearningArticle(entry.metadata, entry.hidden))
    const learning = new Map<string, LearningRelations>()
    const nodes = new Map<string, LearningArticle>()
    const order = new Map(visible.map((entry, position) => [entry.id, position]))
    for (const { id, title, publishHref, metadata, catalogTitle } of visible) {
        nodes.set(id, { id, title: title || catalogTitle || id, href: publishHref, label: metadata.menuTitle || catalogTitle || title || id })
        learning.set(id, { prerequisites: [], successors: [] })
    }
    const edges = buildLearningEdges(visible.map(entry => ({ id: entry.id, pre: entry.metadata.pre })))
    for (const { from, to } of edges) {
        learning.get(from)!.successors.push(nodes.get(to)!)
        learning.get(to)!.prerequisites.push(nodes.get(from)!)
    }
    for (const article of learning.values()) {
        article.prerequisites.sort((left, right) => order.get(left.id)! - order.get(right.id)!)
    }

    return { byId, bySourcePath, byPublishHref, all: entries, learning }
}
