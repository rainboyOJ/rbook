export interface ArticleMetadata {
    id: string
    title: string
    file: string
    copy?: string[]
    teachPlan?: string
    /** `false` 时不自动追加「相关题解」小节（默认追加） */
    practice?: boolean | string
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