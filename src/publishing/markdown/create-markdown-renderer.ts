import MarkdownIt from 'markdown-it'
import fs from 'fs'
import path from 'path'
import { registerPlugins } from './plugin-registry'
import { RbookLinkOptions } from './plugins/rbook-link'
import { ExcalidrawOptions } from './plugins/excalidraw'
import { ArticleIndex } from '../domain/metadata'
import { ProblemProvider } from '../integrations/problem-provider'
import { Diagnostic } from '../domain/diagnostics'
import { ContentMacrosOptions } from './plugins/content-macros'
import { IncludeOptions } from './plugins/include'
import { ProblemUrlResolver } from '../integrations/problem-url'
import { AnimateOptions, renderAnimateDirectives } from './plugins/animate'

export interface RendererOptions {
    index: ArticleIndex
    problemProvider?: ProblemProvider
    blogUrl?: string
    rojBaseUrl?: string
    diagnostics?: Diagnostic[]
    debug?: boolean
    excalidraw?: ExcalidrawOptions
    contentMacros?: ContentMacrosOptions
    /** 项目根目录，用于推导 include 的允许根目录（book/ 与 algo_template/） */
    projectRoot?: string
    /** 覆盖 include 配置（测试用） */
    include?: IncludeOptions
    /** 覆盖题目链接解析器（测试用） */
    problemUrl?: ProblemUrlResolver
    /** 当前文章源路径（用于诊断定位与去重） */
    currentSourcePath?: string
    /** 覆盖交互动画引用配置（测试用）。 */
    animate?: AnimateOptions
}

export interface RenderResult {
    header: { title: string }
    content: string
    diagnostics: Diagnostic[]
}

export function createMarkdownRenderer(opts: RendererOptions): MarkdownIt {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    })

    // 题目链接解析器：统一 oj-pid -> URL/标题 的路由（见 problem-url.ts）
    const problemUrl = opts.problemUrl || (opts.projectRoot
        ? new ProblemUrlResolver({ projectRoot: opts.projectRoot, diagnostics: opts.diagnostics })
        : undefined)

    const linkOpts: RbookLinkOptions = {
        index: opts.index,
        problemProvider: opts.problemProvider,
        problemUrl,
        blogUrl: opts.blogUrl,
        rojBaseUrl: opts.rojBaseUrl,
        diagnostics: opts.diagnostics,
        debug: opts.debug,
        currentSourcePath: opts.currentSourcePath,
    }

    const animate = animateOpts(opts)
    const include = includeOpts(opts)
    if (include && animate) {
        include.transformSource = (source, sourcePath) => renderAnimateDirectives(source, sourcePath, animate)
    }

    registerPlugins(md, {
        rbookLink: linkOpts,
        excalidraw: opts.excalidraw,
        contentMacros: opts.contentMacros,
        // 只在真正配置了允许根目录时才安装 include 插件。
        // 若 roots 为空（未传 projectRoot），保持旧行为：不拦截任何
        // include，完全交给 contentMacros/EJS 处理，避免把原本可用的
        // EJS include 变成“路径越界”失败。
        include,
        animate,
    })

    return md
}

function animateOpts(opts: RendererOptions): AnimateOptions | undefined {
    if (opts.animate) return opts.animate
    if (!opts.projectRoot) return undefined
    const root = path.join(opts.projectRoot, 'book')
    if (!fs.existsSync(root)) return undefined
    return { root, projectRoot: opts.projectRoot, diagnostics: opts.diagnostics }
}

function includeOpts(opts: RendererOptions): IncludeOptions | undefined {
    if (opts.include) return opts.include
    const roots = includeRoots(opts.projectRoot)
    if (roots.length === 0) return undefined
    return { roots, projectRoot: opts.projectRoot, diagnostics: opts.diagnostics }
}

/**
 * include 允许访问的根目录：book/（正文与片段）与 algo_template/（共享代码模板）。
 * 两者都不存在时返回空数组，此时任何 include 都会报越界错误而非静默。
 */
function includeRoots(projectRoot?: string): string[] {
    if (!projectRoot) return []
    const candidates = ['book', 'algo_template'].map(d => path.join(projectRoot, d))
    // 只保留真实存在的目录，避免把不存在的路径当成合法根
    return candidates.filter(p => fs.existsSync(p))
}

export function renderMarkdown(raw: string, md: MarkdownIt, env?: Record<string, unknown>): { header: { title: string }, content: string } {
    const lines = raw.split('\n')
    let header = { title: '' }
    let body = raw

    if (lines[0] && lines[0].trim() === '---') {
        const endIdx = lines.indexOf('---', 1)
        if (endIdx > 1) {
            const fmLines = lines.slice(1, endIdx)
            body = lines.slice(endIdx + 1).join('\n')
            for (const line of fmLines) {
                const m = line.match(/^title\s*:\s*(.+)$/i)
                if (m) header.title = m[1].trim()
            }
        }
    }

    const content = md.render(body, env || {})
    return { header, content }
}
