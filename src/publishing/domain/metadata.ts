export interface ArticleMetadata {
    id: string
    title: string
    file: string
    copy?: string[]
    teachPlan?: string
    [key: string]: unknown
}

export interface ArticleIndexEntry {
    id: string
    title: string
    sourcePath: string
    publishHref: string
    metadata: ArticleMetadata
}

export interface ArticleIndex {
    byId: Map<string, ArticleIndexEntry>
    bySourcePath: Map<string, ArticleIndexEntry>
    byPublishHref: Map<string, ArticleIndexEntry>
    all: ArticleIndexEntry[]
}