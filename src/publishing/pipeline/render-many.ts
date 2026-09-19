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

    // 本次批量渲染产生的诊断，最后要回灌到调用方的数组，
    // 否则 reportDiagnostics 看不到渲染期警告/错误（会被静默丢弃）。
    const callerDiagnostics = opts.diagnostics

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

    // 把本次渲染的诊断回灌给调用方，使 build 的诊断报告能看到它们。
    // 注意：必须在循环结束后合并，避免与 renderArticle 内部的数组别名重复。
    if (callerDiagnostics && callerDiagnostics !== result.diagnostics) {
        callerDiagnostics.push(...result.diagnostics)
    }

    return result
}