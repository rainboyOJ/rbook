import MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'

export default function fencePlugin(md: MarkdownIt): void {
    const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.fence = function(tokens, idx, options, env, slf) {
        const token = tokens[idx]
        const code = token.content.trim()
        const info = token.info ? md.utils.unescapeAll(token.info).trim() : ''
        const langName = info ? info.split(/\s+/g)[0] : ''

        switch (langName) {
            case 'mermaid':
                return `<pre class="mermaid">${code}</pre>`
            case 'plantuml':
                return `<pre class="plantuml">${code}</pre>`
            case 'dot':
                return `<pre class="dot">${code}</pre>`
            case 'pseudocode':
                return `<pre class="pseudocode">${code}</pre>`
            default:
                break
        }

        const rendered = defaultFence(tokens, idx, options, env, slf)
        const content = tokens[idx].content
            .replaceAll('"', '&quot;')
            .replaceAll('\'', '&lt;')

        if (content && content.length > 0) {
            return `
<div style="position: relative" class="code-with-linenumber">
    ${rendered}
    <button class="markdown-it-code-copy" data-clipboard-text="${content}" style="position: absolute; top: 17.5px; right: 10px; cursor: pointer; outline: none;" onclick="window.myclipboard(this)" title="Copy">
        <span style="font-size: 21px; opacity: 0.4;" class="mdi mdi-content-copy"></span>
    </button>
</div>`
        }

        return rendered
    }
}