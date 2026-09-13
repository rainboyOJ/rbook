import MarkdownIt from 'markdown-it'
import mathPlugin from './plugins/math'
import contentMacrosPlugin, { ContentMacrosOptions } from './plugins/content-macros'
import containersPlugin from './plugins/containers'
import pseudocodePlugin, { PseudocodePluginOptions } from './plugins/pseudocode'
import rbookLinkPlugin, { RbookLinkOptions } from './plugins/rbook-link'
import problemListPlugin from './plugins/problem-list'
import fencePlugin from './plugins/fence'
import excalidrawPlugin, { ExcalidrawOptions } from './plugins/excalidraw'

export interface PluginRegistryOptions {
    rbookLink: RbookLinkOptions
    excalidraw?: ExcalidrawOptions
    contentMacros?: ContentMacrosOptions
    pseudocode?: PseudocodePluginOptions
}

/**
 * 按 4 类生命周期显式注册插件：
 * 1. 标准语法扩展 (Math / KaTeX)
 * 2. Rbook 内容扩展 (EJS 宏、容器、伪代码、链接、题目列表)
 * 3. 外部集成 (Fences / 图表、Excalidraw SVG)
 * 4. 输出后处理
 */
export function registerPlugins(md: MarkdownIt, opts: PluginRegistryOptions): void {
    // 1. 标准语法
    md.use(mathPlugin, { diagnostics: opts.rbookLink.diagnostics })

    // 2. Rbook 内容扩展
    md.use(contentMacrosPlugin, {
        ...opts.contentMacros,
        rojBaseUrl: opts.rbookLink.rojBaseUrl,
        diagnostics: opts.rbookLink.diagnostics,
    })
    md.use(containersPlugin)
    md.use(pseudocodePlugin, {
        ...opts.pseudocode,
        diagnostics: opts.rbookLink.diagnostics,
    })
    md.use(rbookLinkPlugin, opts.rbookLink)
    md.use(problemListPlugin, opts.rbookLink)

    // 3. 外部集成
    md.use(fencePlugin)
    md.use(excalidrawPlugin, opts.excalidraw || {})

    // 4. 后处理可在必要时挂载 rules
}