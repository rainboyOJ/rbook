import MarkdownIt from 'markdown-it'
import path from 'path'
import type { Diagnostic } from '../../domain/diagnostics'

let pseudocodeRenderer: { renderToString: (code: string, options: Record<string, unknown>) => string } | null = null

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    pseudocodeRenderer = require('../../vendor/pseudocode.min.js')
}
catch {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        pseudocodeRenderer = require(path.join(__dirname, '../../vendor/pseudocode.min.js'))
    }
    catch {
        pseudocodeRenderer = null
    }
}

export interface PseudocodePluginOptions {
    lineNumber?: boolean
    indentSize?: string
    diagnostics?: Diagnostic[]
}

export function renderPseudocodeBlock(code: string, opts: PseudocodePluginOptions = {}): string {
    const options = {
        lineNumber: opts.lineNumber ?? true,
        indentSize: opts.indentSize ?? '1.2em',
        throwOnError: false,
    }

    if (pseudocodeRenderer && typeof pseudocodeRenderer.renderToString === 'function') {
        try {
            const rendered = pseudocodeRenderer.renderToString(code, options)
            return `<div class="pseudocode"><p>${rendered}</p></div>\n`
        }
        catch (err) {
            opts.diagnostics?.push({
                phase: 'pseudocode',
                level: 'warning',
                message: `伪代码渲染失败: ${err instanceof Error ? err.message : String(err)}`,
            })
        }
    }

    // 回退渲染
    const escaped = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    return `<pre class="pseudocode">${escaped}</pre>\n`
}

export default function pseudocodePlugin(md: MarkdownIt, opts: PseudocodePluginOptions = {}): void {
    // 1. 处理 ::: pseudocode 语法块
    md.block.ruler.after('blockquote', 'rbook_pseudocode_block', (state, start, end, silent) => {
        const pos = state.bMarks[start] + state.tShift[start]
        const max = state.eMarks[start]

        if (pos + 14 > max) return false
        if (state.src.slice(pos, pos + 14) !== '::: pseudocode') return false

        if (silent) return true

        let next = start + 1
        let found = false
        let lastLine = ''

        for (; next < end; next++) {
            const lineStart = state.bMarks[next] + state.tShift[next]
            const lineMax = state.eMarks[next]
            const lineText = state.src.slice(lineStart, lineMax).trim()

            if (lineText === ':::') {
                found = true
                break
            }
        }

        const content = state.getLines(start + 1, next, state.tShift[start], false)
        state.line = found ? next + 1 : next

        const token = state.push('rbook_pseudocode', 'div', 0)
        token.block = true
        token.content = content
        return true
    })

    md.renderer.rules.rbook_pseudocode = (tokens, idx) => {
        return renderPseudocodeBlock(tokens[idx].content, opts)
    }
}
