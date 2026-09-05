import { resolveArticleSource } from '../content/source-resolver'
import { PathPolicy } from '../content/path-policy'
import { createMarkdownRenderer, renderMarkdown } from '../markdown/create-markdown-renderer'
import { buildArticleView, ArticleView } from '../templates/article-view'
import { PageTemplateRenderer } from '../templates/page-template-renderer'
import { ArtifactWriter } from './artifact-writer'
import { Diagnostic } from '../domain/diagnostics'
import { ArticleIndex } from '../domain/metadata'
import { ProblemProvider } from '../integrations/problem-provider'
import path from 'path'

export interface RenderArticleOptions {
    entryPath: string
    policy: PathPolicy
    index: ArticleIndex
    templateRenderer: PageTemplateRenderer
    templateName?: string
    problemProvider?: ProblemProvider
    blogUrl?: string
    rojBaseUrl?: string
    diagnostics?: Diagnostic[]
    debug?: boolean
}

export interface RenderArticleResult {
    view: ArticleView
    html: string
    diagnostics: Diagnostic[]
    relatedDocuments: Array<{ title: string; href: string }>
}

export function renderArticle(opts: RenderArticleOptions): RenderArticleResult {
    const diag = opts.diagnostics || []
    const policy = opts.policy

    const resolved = resolveArticleSource(opts.entryPath, policy.book, diag)

    const renderer = createMarkdownRenderer({
        index: opts.index,
        problemProvider: opts.problemProvider,
        blogUrl: opts.blogUrl,
        rojBaseUrl: opts.rojBaseUrl,
        diagnostics: diag,
        debug: opts.debug,
    })

    const { header, content } = renderMarkdown(resolved.source.raw, renderer, {
        id: resolved.metadata.id,
        currentMdFilePath: resolved.source.filePath,
    })

    const publishHref = policy.publishHref(resolved.source.filePath)
    const outputPath = policy.outputPath(resolved.source.filePath)
    const gitLocation = policy.gitLocation(resolved.source.filePath)

    let teachPlanHref: string | undefined
    const relatedDocuments: Array<{ title: string; href: string }> = []

    if (resolved.metadata.teachPlan) {
        const teachPlanPath = policy.resolveSource(
            policy.relativeToBook(
                resolved.source.filePath.replace(/[^/]+$/, resolved.metadata.teachPlan)
            )
        )
        teachPlanHref = policy.publishHref(teachPlanPath)
        relatedDocuments.push({ title: '教学计划', href: teachPlanHref })
    }

    const view = buildArticleView({
        article: resolved.source,
        metadata: resolved.metadata,
        content,
        header,
        publishHref,
        outputPath,
        gitLocation,
        teachPlanHref,
    })

    const html = opts.templateRenderer.render(opts.templateName || 'article.html', view)

    return { view, html, diagnostics: diag, relatedDocuments }
}

export function renderRelatedDocuments(
    opts: RenderArticleOptions,
    parentResult: RenderArticleResult,
): void {
    if (!parentResult.view.teachPlanHref || !parentResult.view.metadata.teachPlan) return

    const sourceDir = parentResult.view.sourcePath.substring(0, parentResult.view.sourcePath.lastIndexOf('/'))
    const teachPlanFullPath = opts.policy.resolveSource(
        opts.policy.relativeToBook(
            path.join(sourceDir, parentResult.view.metadata.teachPlan)
        )
    )

    const resolved = resolveArticleSource(teachPlanFullPath, opts.policy.book, opts.diagnostics)
    const renderer = createMarkdownRenderer({
        index: opts.index,
        problemProvider: opts.problemProvider,
        blogUrl: opts.blogUrl,
        rojBaseUrl: opts.rojBaseUrl,
        diagnostics: opts.diagnostics,
        debug: opts.debug,
    })

    const { header, content } = renderMarkdown(resolved.source.raw, renderer)
    const view = buildArticleView({
        article: resolved.source,
        metadata: resolved.metadata,
        content,
        header,
        publishHref: opts.policy.publishHref(resolved.source.filePath),
        outputPath: opts.policy.outputPath(resolved.source.filePath),
        gitLocation: opts.policy.gitLocation(resolved.source.filePath),
    })

    const html = opts.templateRenderer.render('article.html', view)
    const writer = new ArtifactWriter({ diagnostics: opts.diagnostics })
    writer.writeHtml(view.outputPath, html)
}