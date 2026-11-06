import MarkdownIt from 'markdown-it'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const katex = require('katex')

import { renderPseudocodeBlock } from './pseudocode'
import { renderCodeTabPane, type CodeTabMeta } from './code-tabs'
import { highlightCode } from '../highlight'
import { renderGraphvizSvg } from './graphviz'
import type { Diagnostic } from '../../domain/diagnostics'

interface FenceOptions {
    diagnostics?: Diagnostic[]
    currentSourcePath?: string
}

function renderCopyableCode(md: MarkdownIt, source: string, language: string): string {
    const rendered = highlightCode(source, language)
    const content = md.utils.escapeHtml(source)
    if (!content) return rendered
    const lineCount = source.replace(/\n$/, '').split('\n').length
    const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')
    return `
<div class="code-with-linenumber line-numbers-mode">
    <pre class="line-numbers-pre"><span class="line-numbers-wrapper" aria-hidden="true">${numbers}</span></pre>
    ${rendered}
    <button class="markdown-it-code-copy" data-clipboard-text="${content}" title="复制" onclick="window.myclipboard(this)">复制</button>
</div>`
}

export default function fencePlugin(md: MarkdownIt, opts: FenceOptions = {}): void {
    md.core.ruler.before('block', 'rbook_graphviz_counter', state => {
        state.env.rbookGraphvizIndex = 0
    })
    md.renderer.rules.fence = function(tokens, idx, options, env, slf) {
        const token = tokens[idx]
        const code = token.content.trim()
        const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
        const langName = info ? info.split(/\s+/g)[0] : ''

        switch (langName.toLowerCase()) {
            case 'mermaid':
                return `<pre class="mermaid">${code}</pre>`
            case 'plantuml':
                return `<pre class="plantuml">${code}</pre>`
            case 'dot':
            case 'viz-dot': {
                const svg = renderGraphvizSvg(token.content, {
                    idPrefix: `rbook-graphviz-${++env.rbookGraphvizIndex}-`,
                    sourcePath: env.currentMdFilePath || opts.currentSourcePath,
                    line: token.map ? token.map[0] + 1 : undefined,
                    diagnostics: opts.diagnostics,
                })
                const html = `<div class="rbook-graphviz">
<div class="rbook-graphviz__canvas">${svg}</div>
<details class="rbook-graphviz__source"><summary>查看 DOT 源码</summary>
${renderCopyableCode(md, token.content, 'dot')}
</details>
</div>\n`
                const tabs = token.meta && (token.meta as { codeTabs?: CodeTabMeta }).codeTabs
                return tabs ? renderCodeTabPane(tabs, html) : html
            }
            case 'pseudocode':
                return renderPseudocodeBlock(code)
            case 'math':
                try {
                    return `<p class="katex-block">${katex.renderToString(code, { displayMode: true, throwOnError: false })}</p>`
                }
                catch {
                    break
                }
            default:
                break
        }

        const html = renderCopyableCode(md, token.content, langName)

        // code-tabs 插件在 core 阶段给同组 fence 打了 meta.codeTabs，
        // 这里顺手把渲染好的代码块包成标签面板（标签栏只在第一块上输出）。
        const tabs = token.meta && (token.meta as { codeTabs?: CodeTabMeta }).codeTabs
        if (tabs) return renderCodeTabPane(tabs, html)

        return html
    }
}
