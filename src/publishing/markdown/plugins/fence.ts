import MarkdownIt from 'markdown-it'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const katex = require('katex')

import { renderPseudocodeBlock } from './pseudocode'
import { highlightCode } from '../highlight'

export default function fencePlugin(md: MarkdownIt): void {
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
                return `<pre class="dot">${code}</pre>`
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

        const rendered = highlightCode(token.content, langName)
        const content = tokens[idx].content
            .replaceAll('"', '&quot;')
            .replaceAll('\'', '&#39;')

        if (content && content.length > 0) {
            // 构建期生成行号列：与代码同 lineHeight、右对齐、borderRight 分隔，
            // 样式见 markdown-r.scss 的 .line-numbers-mode（VuePress 风格）。
            // aria-hidden + user-select:none，不影响复制与无障碍。
            const lineCount = token.content.replace(/\n$/, '').split('\n').length
            const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')
            return `
<div class="code-with-linenumber line-numbers-mode">
    <pre class="line-numbers-pre"><span class="line-numbers-wrapper" aria-hidden="true">${numbers}</span></pre>
    ${rendered}
    <button class="markdown-it-code-copy" data-clipboard-text="${content}" title="复制" onclick="window.myclipboard(this)">复制</button>
</div>`
        }

        return rendered
    }
}