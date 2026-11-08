export interface ArticleMetadata {
    id: string
    /** 正文标题，可以长。页面 <title>、正文 H1、catalog.json 都用它。 */
    title: string
    /**
     * 侧边栏菜单名，可选，要短。
     *
     * 菜单栏窄，所以和正文标题分两轨：写了它就用它，没写回退到
     * catalog.yaml 的 title。见 docs/adr/0012-dual-track-article-titles.md。
     */
    menuTitle?: string
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