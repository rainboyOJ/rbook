import MarkdownIt from 'markdown-it'
import type { ArticleIndex } from '../../domain/metadata'
import type { ProblemProvider } from '../../integrations/problem-provider'
import type { Diagnostic } from '../../domain/diagnostics'

export interface RbookLinkOptions {
    index: ArticleIndex
    problemProvider?: ProblemProvider
    blogUrl?: string
    rojBaseUrl?: string
    diagnostics?: Diagnostic[]
    debug?: boolean
}

const colonSplitReg = /\s*(.+)\s*:\s*(.+)\s*/

function renderRbookLink(content: string, opts: RbookLinkOptions): string {
    const m = colonSplitReg.exec(content)
    if (!m) return `<span>${content}</span>`

    const [, rawType, id] = m
    const type = rawType.toLowerCase()
    const base = opts.blogUrl || 'https://rbook.roj.ac.cn'

    if (type === 'rbook') {
        const info = opts.index.byId.get(id)
        if (info) {
            return `<a class="extra-link" target="_blank" href="${base}${info.publishHref}">[<img src="${base}/rbookIcon/favicon-32x32.png"/> Rbook: ${info.metadata.title || id}]</a>`
        }
        opts.diagnostics?.push({
            phase: 'rbook-link',
            level: 'warning',
            message: `rbook 链接找不到目标: [[[rbook: ${id}]]]`,
        })
        return `<span class="extra-link missing">[rbook: ${id}]</span>`
    }

    if (type === 'p' || type === 'problem') {
        if (!opts.problemProvider || !opts.problemProvider.getProblemById) {
            opts.diagnostics?.push({
                phase: 'rbook-link',
                level: 'error',
                message: `题目 provider 未配置: [[[p: ${id}]]]`,
                suggestion: '配置 ProblemProvider 后重新渲染',
            })
            return `<span class="extra-link missing">[problem: ${id}]</span>`
        }
        const info = opts.problemProvider.getProblemById(id)
        if (info) {
            const rojBase = opts.rojBaseUrl || 'https://roj.ac.cn'
            return `<a class="extra-link" target="_blank" href="${rojBase}${info.link}">[<img src="${rojBase}/fav/favicon-32x32.png"/> ${info.oj} ${info.sid}: ${info.title}]</a>`
        }
        return `<span class="extra-link missing">[problem: ${id}]</span>`
    }

    return `<span>${content}</span>`
}

export default function rbookLinkPlugin(md: MarkdownIt, opts: RbookLinkOptions): void {
    md.inline.ruler.before('link', 'rbook_link', function tripleBracketParse(state, silent) {
        let pos = state.pos
        const max = state.posMax
        let ch = state.src.charCodeAt(pos)

        if (ch !== 0x5B) return false
        if (pos + 1 >= max || state.src.charCodeAt(pos + 1) !== 0x5B) return false
        if (pos + 2 >= max || state.src.charCodeAt(pos + 2) !== 0x5B) return false

        const start = pos
        pos += 3
        if (pos >= max) return false
        const matchStart = pos

        while (pos < max && state.src.charCodeAt(pos) !== 0x5D) pos++
        if (pos + 1 >= max || state.src.charCodeAt(pos + 1) !== 0x5D) return false
        if (pos + 2 >= max || state.src.charCodeAt(pos + 2) !== 0x5D) return false

        const matchEnd = pos
        if (!silent) {
            const content = state.src.slice(matchStart, matchEnd)
            const token = state.push('rbook_link', 'span', 0)
            token.meta = content
        }
        state.pos = matchEnd + 3
        return true
    })

    md.renderer.rules.rbook_link = (tokens, idx) => {
        return renderRbookLink(tokens[idx].meta, opts)
    }
}