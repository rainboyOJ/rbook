import { ArticleSource } from '../domain/article'
import { ArticleMetadata } from '../domain/metadata'

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
}): ArticleView {
    return {
        title: params.metadata.title || params.header.title || '未知',
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