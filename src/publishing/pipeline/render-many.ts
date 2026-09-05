import { renderArticle, RenderArticleOptions } from './render-article'
import { renderRelatedDocuments } from './render-article'
import { ArtifactWriter } from './artifact-writer'
import { Diagnostic } from '../domain/diagnostics'

export interface RenderManyOptions extends RenderArticleOptions {
    /** 是否渲染关联文档（教学计划等） */
    withRelated?: boolean
}

export interface RenderManyResult {
    total: number
    succeeded: number
    failed: number
    diagnostics: Diagnostic[]
    errors: Array<{ entryPath: string; error: string }>
}

export function renderMany(entries: string[], opts: RenderManyOptions): RenderManyResult {
    const result: RenderManyResult = {
        total: entries.length,
        succeeded: 0,
        failed: 0,
        diagnostics: [],
        errors: [],
    }

    const writer = new ArtifactWriter({ diagnostics: result.diagnostics })

    for (const entryPath of entries) {
        try {
            const articleResult = renderArticle({ ...opts, entryPath, diagnostics: result.diagnostics })
            writer.writeHtml(articleResult.view.outputPath, articleResult.html)

            // Copy artifacts
            if (articleResult.view.metadata.copy && articleResult.view.metadata.copy.length > 0) {
                writer.copyArtifacts(
                    articleResult.view.sourcePath.substring(0, articleResult.view.sourcePath.lastIndexOf('/')),
                    articleResult.view.outputPath.substring(0, articleResult.view.outputPath.lastIndexOf('/')),
                    articleResult.view.metadata.copy,
                )
            }

            // Render related documents (teach plan)
            if (opts.withRelated && articleResult.view.teachPlanHref) {
                try {
                    renderRelatedDocuments(opts, articleResult)
                }
                catch (e) {
                    result.diagnostics.push({
                        phase: 'render-many',
                        articleId: articleResult.view.id,
                        level: 'error',
                        message: `关联文档渲染失败: ${e instanceof Error ? e.message : String(e)}`,
                    })
                }
            }

            result.succeeded++
        }
        catch (e) {
            result.failed++
            result.errors.push({
                entryPath,
                error: e instanceof Error ? e.message : String(e),
            })
            result.diagnostics.push({
                phase: 'render-many',
                sourcePath: entryPath,
                level: 'error',
                message: `渲染失败: ${e instanceof Error ? e.message : String(e)}`,
            })
        }
    }

    return result
}