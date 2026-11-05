import { ArticleSource } from '../domain/article'
import { ArticleMetadata } from '../domain/metadata'
import { resolveArticleTitle } from '../domain/article-title'

export interface ArticleView {
    title: string
    id: string
    href: string
    publishHref: string
    gitLocation: string
    sourcePath: string
    outputPath: string
    outputDir: string
    content: string
    header: { title: string }
    metadata: ArticleMetadata
    teachPlanHref?: string
    badges?: { label: string; href: string }[]
}

export function buildArticleView(params: {
    article: ArticleSource
    metadata: ArticleMetadata
    content: string
    header: { title: string }
    publishHref: string
    outputPath: string
    gitLocation: string
    teachPlanHref?: string
    /** catalog.yaml 里的导航标题，用于 metadata 与 md H1 都缺失时兜底 */
    catalogTitle?: string
}): ArticleView {
    return {
        // 与 dist/catalog.json 共用同一套优先级，避免页面和清单显示不同标题。
        title: resolveArticleTitle({
            metadataTitle: params.metadata.title,
            headerTitle: params.header.title,
            catalogTitle: params.catalogTitle,
        }),
        id: params.metadata.id,
        href: params.publishHref,
        publishHref: params.publishHref,
        gitLocation: params.gitLocation,
        sourcePath: params.article.filePath,
        outputPath: params.outputPath,
        outputDir: params.outputPath.substring(0, params.outputPath.lastIndexOf('/')),
        content: params.content,
        header: params.header,
        metadata: params.metadata,
        teachPlanHref: params.teachPlanHref,
    }
}