import { ArticleIndexEntry } from './metadata'
import { Catalog } from './catalog'

export function buildArticleIndex(catalog: Catalog, entries: ArticleIndexEntry[]): {
    byId: Map<string, ArticleIndexEntry>
    bySourcePath: Map<string, ArticleIndexEntry>
    byPublishHref: Map<string, ArticleIndexEntry>
    all: ArticleIndexEntry[]
} {
    const byId = new Map<string, ArticleIndexEntry>()
    const bySourcePath = new Map<string, ArticleIndexEntry>()
    const byPublishHref = new Map<string, ArticleIndexEntry>()

    for (const entry of entries) {
        if (entry.id) byId.set(entry.id, entry)
        if (entry.sourcePath) bySourcePath.set(entry.sourcePath, entry)
        if (entry.publishHref) byPublishHref.set(entry.publishHref, entry)
    }

    return { byId, bySourcePath, byPublishHref, all: entries }
}