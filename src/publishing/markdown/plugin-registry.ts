import MarkdownIt from 'markdown-it'
import mathPlugin from './plugins/math'
import contentMacrosPlugin, { ContentMacrosOptions } from './plugins/content-macros'
import includePlugin, { IncludeOptions } from './plugins/include'
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
    include?: IncludeOptions
    pseudocode?: PseudocodePluginOptions
}

/**
 * 按 4 类生命周期显式注册插件：
 * 1. 标准语法扩展 (Math / KaTeX)
 * 2. Rbook 内容扩展 (EJS 宏、include、容器、伪代码、链接、题目列表)
 * 3. 外部集成 (Fences / 图表、Excalidraw SVG)
 * 4. 输出后处理
 */
export function registerPlugins(md: MarkdownIt, opts: PluginRegistryOptions): void {
    // 1. 标准语法
    md.use(mathPlugin, { diagnostics: opts.rbookLink.diagnostics })

    // 2. Rbook 内容扩展
    // 顺序很关键：include 必须先在 contentMacros 之前展开。
    // 因为被 include 的片段自身可能含遗留 EJS 宏（实测 17 个片段如此，
    // 如 practice.md 里的 pid_to_url、problem.md 里的 video），
    // 必须先内联进父文档，再由 contentMacros 统一渲染这些宏。
    // 若反过来，片段里的宏会因“已错过 EJS 处理时机”而泄漏成原文。
    if (opts.include) {
        md.use(includePlugin, {
            ...opts.include,
            diagnostics: opts.include.diagnostics || opts.rbookLink.diagnostics,
        })
    }
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