import MarkdownIt from 'markdown-it'
import type { ArticleIndex } from '../../domain/metadata'
import type { ProblemProvider } from '../../integrations/problem-provider'
import type { ProblemUrlResolver } from '../../integrations/problem-url'
import type { Diagnostic } from '../../domain/diagnostics'

export interface RbookLinkOptions {
    index: ArticleIndex
    problemProvider?: ProblemProvider
    /** 题目 URL/标题解析器（新机制）；缺失时回退到 problemProvider */
    problemUrl?: ProblemUrlResolver
    blogUrl?: string
    rojBaseUrl?: string
    diagnostics?: Diagnostic[]
    debug?: boolean
    /** 当前文章源路径（用于诊断定位与去重） */
    currentSourcePath?: string
}

const colonSplitReg = /\s*(.+?)\s*:\s*([\s\S]+)\s*/

/** 已就 pp 弃用发过警告的“文件+类型”集合，避免同一文章刷屏。 */
const ppWarned = new Set<string>()

/** 仅测试用：重置去重状态。 */
export function resetPpWarningState(): void {
    ppWarned.clear()
}

/**
 * 解析题目参数：`oj-pid` 或 `oj-pid | 标题`。
 * pid 本身可含短横/斜杠（如 noi_openjudge 的 ch0304-2406、
 * vjudge 的 HDU-1556），所以按**第一个**短横切分 oj 与 pid。
 */
export function parseProblemRef(spec: string): { oj: string, pid: string, inlineTitle?: string } | null {
    const bar = spec.indexOf('|')
    const head = (bar >= 0 ? spec.slice(0, bar) : spec).trim()
    const inlineTitle = bar >= 0 ? spec.slice(bar + 1).trim() : undefined
    const dash = head.indexOf('-')
    if (dash <= 0) return null
    const oj = head.slice(0, dash).trim()
    const pid = head.slice(dash + 1).trim()
    if (!oj || !pid) return null
    return { oj, pid, inlineTitle: inlineTitle || undefined }
}

function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * 交叉引用的标记：1em 单色描边 SVG，跟随 currentColor，由 CSS 收到正文墨色。
 *
 * - 文章（`article`）：一页带折角，读作“书内另一篇”。
 * - 题目（`problem`）：右上箭头，读作“离开本书去 OJ 站”。
 *
 * 以前这里是 32×32 的彩色 favicon `<img>`：位图与正文宋体打架，还把 18px/30px 的
 * 行撑高；而且它的 22px 上限被 `.rbook-article .markdown-body img` 的
 * `height:auto` 压掉从未生效。换成内联 SVG 后不再受 `img` 规则影响。
 */
const LINK_MARKS = {
    // 单笔折角：右上角直接切一刀（z 收尾），比“方框 + 内部折线”在小字号下更干净。
    article: '<svg class="extra-link__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H6.5A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V8z"/></svg>',
    problem: '<svg class="extra-link__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
} as const

function linkAnchor(kind: keyof typeof LINK_MARKS, href: string, text: string): string {
    return `<a class="extra-link extra-link--${kind}" target="_blank" href="${href}">${LINK_MARKS[kind]}${text}</a>`
}

function renderRbookLink(content: string, opts: RbookLinkOptions): string {
    const m = colonSplitReg.exec(content)
    if (!m) return `<span>${content}</span>`

    const [, rawType, rawBody] = m
    const type = rawType.toLowerCase()
    const base = opts.blogUrl || 'https://rbook.roj.ac.cn'

    if (type === 'rbook') {
        const id = rawBody.trim()
        const info = opts.index.byId.get(id)
        if (info) {
            const title = info.metadata ? info.metadata.title : ((info as unknown as Record<string, unknown>).title as string) || id
            return linkAnchor('article', `${base}${info.publishHref}`, escapeHtml(title))
        }
        opts.diagnostics?.push({
            phase: 'rbook-link',
            level: 'warning',
            message: `rbook 链接找不到目标: [[[rbook: ${id}]]]`,
        })
        return `<span class="extra-link missing">[rbook: ${id}]</span>`
    }

    if (type === 'p' || type === 'problem' || type === 'pp' || type === 'problem_info_solution') {
        return renderProblemLink(type, rawBody, rawType, opts)
    }

    return `<span>${content}</span>`
}

function renderProblemLink(type: string, body: string, rawType: string, opts: RbookLinkOptions): string {
    // pp 的 ✓ 原本依赖题库的 hasSolution；不查库后语义等同 p。
    // 按“文件+类型”去重，避免同一篇文章里的 295 处 pp 刷出 295 条警告。
    if (type === 'pp' || type === 'problem_info_solution') {
        const key = `${opts.currentSourcePath || ''}|${type}`
        if (!ppWarned.has(key)) {
            ppWarned.add(key)
            opts.diagnostics?.push({
                phase: 'rbook-link',
                level: 'warning',
                sourcePath: opts.currentSourcePath,
                message: `[[[${rawType}: ...]]] 的 ✓ 语义已废弃，请统一为 [[[p: ...]]]`,
                suggestion: '[[[pp:]]] 现在等同 [[[p:]]]',
            })
        }
    }

    // 新机制：解析器可用时优先使用（标题来自题库仓库 + 官方站回退）
    if (opts.problemUrl) {
        const ref = parseProblemRef(body)
        if (!ref) {
            opts.diagnostics?.push({
                phase: 'rbook-link',
                level: 'error',
                message: `题目引用格式错误: [[[${rawType}: ${body}]]]`,
                suggestion: '期望 oj-pid，例如 [[[p: luogu-P1048]]] 或 [[[p: luogu-P1048 | 采药]]]',
            })
            return `<span class="extra-link missing">[problem: ${escapeHtml(body.trim())}]</span>`
        }

        const r = opts.problemUrl.resolve(ref.oj, ref.pid, ref.inlineTitle)
        const text = r.title ? `${r.normalizedOj} ${r.normalizedPid}: ${escapeHtml(r.title)}` : `${r.normalizedOj} ${r.normalizedPid}`
        return linkAnchor('problem', r.url, text)
    }

    // 兼容路径：仍走旧 problemProvider（题库未配置时给出明确诊断）
    const id = body.trim()
    if (!opts.problemProvider || !opts.problemProvider.getProblemById) {
        opts.diagnostics?.push({
            phase: 'rbook-link',
            level: 'error',
            message: `题目 provider 未配置: [[[${rawType}: ${id}]]]`,
            suggestion: '配置 ProblemProvider 后重新渲染',
        })
        return `<span class="extra-link missing">[problem: ${id}]</span>`
    }
    const info = opts.problemProvider.getProblemById(id)
    if (info) {
        const rojBase = opts.rojBaseUrl || 'https://roj.ac.cn'
        const checkmark = (type === 'pp' || type === 'problem_info_solution') && info.hasSolution ? '&#x2713; ' : ''
        return linkAnchor('problem', `${rojBase}${info.link}`, `${checkmark}${info.oj} ${info.sid}: ${info.title}`)
    }
    return `<span class="extra-link missing">[problem: ${id}]</span>`
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

        // 终止符是连续的 `]]]`。不能只找第一个 `]`，
        // 因为标题里可能含方括号（如 "[USACO16JAN] Subsequences..."）。
        const matchEnd = state.src.indexOf(']]]', matchStart)
        if (matchEnd < 0) return false

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
