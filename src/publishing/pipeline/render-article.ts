import fs from 'fs'
import path from 'path'
import { resolveArticleSource } from '../content/source-resolver'
import { PathPolicy } from '../content/path-policy'
import { createMarkdownRenderer, renderMarkdown } from '../markdown/create-markdown-renderer'
import { buildArticleView, ArticleView } from '../templates/article-view'
import { PageTemplateRenderer } from '../templates/page-template-renderer'
import { ArtifactWriter } from './artifact-writer'
import { Diagnostic } from '../domain/diagnostics'
import { ArticleIndex } from '../domain/metadata'
import { ProblemProvider } from '../integrations/problem-provider'
import { ContentMacrosOptions } from '../markdown/plugins/content-macros'

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
    contentMacros?: ContentMacrosOptions
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
        contentMacros: opts.contentMacros,
        projectRoot: policy.root,
        currentSourcePath: resolved.source.filePath,
    })

    const { header, content } = renderMarkdown(resolved.source.raw, renderer, {
        id: resolved.metadata.id,
        currentMdFilePath: resolved.source.filePath,
        root: policy.root,
        basePath: policy.book,
    })

    const publishHref = policy.publishHref(resolved.source.filePath)
    const outputPath = policy.outputPath(resolved.source.filePath)
    const gitLocation = policy.gitLocation(resolved.source.filePath)

    let teachPlanHref: string | undefined
    const relatedDocuments: Array<{ title: string; href: string }> = []

    if (resolved.metadata.teachPlan) {
        const sourceDir = path.dirname(resolved.source.filePath)
        let teachPlanFile = resolved.metadata.teachPlan
        let candidatePath = path.join(sourceDir, teachPlanFile)

        if (!fs.existsSync(candidatePath)) {
            if (teachPlanFile === 'teach_plain.md' && fs.existsSync(path.join(sourceDir, 'teach_plan.md'))) {
                teachPlanFile = 'teach_plan.md'
                resolved.metadata.teachPlan = teachPlanFile
                candidatePath = path.join(sourceDir, teachPlanFile)
            }
            else if (teachPlanFile === 'teach_plan.md' && fs.existsSync(path.join(sourceDir, 'teach_plain.md'))) {
                teachPlanFile = 'teach_plain.md'
                resolved.metadata.teachPlan = teachPlanFile
                candidatePath = path.join(sourceDir, teachPlanFile)
            }
        }

        if (fs.existsSync(candidatePath)) {
            teachPlanHref = policy.publishHref(candidatePath)
            relatedDocuments.push({ title: '教学计划', href: teachPlanHref })
        }
        else {
            diag.push({
                phase: 'render-article',
                level: 'warning',
                sourcePath: resolved.source.filePath,
                message: `声明的教学计划文件不存在: ${teachPlanFile}`,
            })
        }
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

    const sourceDir = path.dirname(parentResult.view.sourcePath)
    let teachPlanFile = parentResult.view.metadata.teachPlan
    let teachPlanFullPath = path.join(sourceDir, teachPlanFile)

    if (!fs.existsSync(teachPlanFullPath)) {
        if (teachPlanFile === 'teach_plain.md' && fs.existsSync(path.join(sourceDir, 'teach_plan.md'))) {
            teachPlanFile = 'teach_plan.md'
            teachPlanFullPath = path.join(sourceDir, teachPlanFile)
        }
        else if (teachPlanFile === 'teach_plan.md' && fs.existsSync(path.join(sourceDir, 'teach_plain.md'))) {
            teachPlanFile = 'teach_plain.md'
            teachPlanFullPath = path.join(sourceDir, teachPlanFile)
        }
    }

    if (!fs.existsSync(teachPlanFullPath)) {
        opts.diagnostics?.push({
            phase: 'render-related',
            level: 'warning',
            sourcePath: parentResult.view.sourcePath,
            message: `教学计划文件不存在: ${teachPlanFullPath}`,
        })
        return
    }

    const resolved = resolveArticleSource(teachPlanFullPath, opts.policy.book, opts.diagnostics)
    const renderer = createMarkdownRenderer({
        index: opts.index,
        problemProvider: opts.problemProvider,
        blogUrl: opts.blogUrl,
        rojBaseUrl: opts.rojBaseUrl,
        diagnostics: opts.diagnostics,
        debug: opts.debug,
        contentMacros: opts.contentMacros,
        projectRoot: opts.policy.root,
        currentSourcePath: resolved.source.filePath,
    })

    const { header, content } = renderMarkdown(resolved.source.raw, renderer, {
        id: resolved.metadata.id,
        currentMdFilePath: resolved.source.filePath,
        root: opts.policy.root,
        basePath: opts.policy.book,
    })

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
