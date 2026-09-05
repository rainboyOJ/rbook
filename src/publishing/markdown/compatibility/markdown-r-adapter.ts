import MarkdownIt from 'markdown-it'
import { createMarkdownRenderer, RendererOptions } from '../create-markdown-renderer'
import { renderMarkdown } from '../create-markdown-renderer'
import contentMacrosPlugin, { ContentMacrosOptions } from '../plugins/content-macros'

/**
 * markdown-r 兼容适配器。
 *
 * 提供旧 `markdown-r` 包的 `{ md, render }` 接口，
 * 内部委托给新的渲染核心。用于 Phase 3 双写/双渲染验证。
 *
 * 注意：这是一个过渡入口，全量切换后应删除。
 */
export interface MarkdownRCompatOptions {
    renderer: RendererOptions
    macros?: ContentMacrosOptions
}

export interface MarkdownRCompat {
    md: MarkdownIt
    render(raw: string, config?: { ejs?: Record<string, unknown>; mdit?: Record<string, unknown> }): {
        header: { title: string }
        content: string
    }
}

export function createMarkdownRCompat(opts: MarkdownRCompatOptions): MarkdownRCompat {
    const md = createMarkdownRenderer(opts.renderer)

    if (opts.macros) {
        md.use(contentMacrosPlugin, opts.macros)
    }

    return {
        md,
        render(raw, config = {}) {
            const env = config.mdit || {}
            return renderMarkdown(raw, md, env)
        },
    }
}