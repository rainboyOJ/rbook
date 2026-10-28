import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
const toc = require('markdown-it-toc-done-right')

/** 目录和标题共用锚点规则；显示编号不参与锚点生成。 */
function slugify(title: string): string {
    return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '') || 'section'
}

interface OutlineEntry {
    level: number
    id: string
    number: string
    title: string
    children: OutlineEntry[]
}

// 仅识别明确的作者编号，避免把「2-SAT」「P2P」等普通词误认成编号。
const AUTHOR_NUMBER = /^(P\d+|(?:性质|定理|引理|推论|例题|例)\s*\d+)(?:[：:、.．]\s*|\s+|$)|^[一二三四五六七八九十百零〇]+[、．.]\s*|^\d+(?:\.\d+)*(?:(?:[、．]|\.(?!\d))\s*|\s+)/u

export default function tocPlugin(md: MarkdownIt): void {
    const options = { level: [2, 3], slugify }
    md.use(anchor, options)
    md.use(toc, options)

    // anchor / generateTocAst 先读取原文。此后再包裹标题，保证旧锚点稳定。
    md.core.ruler.after('generateTocAst', 'rbook_heading_outline', state => {
        const counters = Array<number>(7).fill(0)
        const root: OutlineEntry = { level: 0, id: '', number: '', title: '', children: [] }
        const stack = [root]
        state.env.rbookOutline = root.children

        for (let i = 0; i < state.tokens.length; i++) {
            const heading = state.tokens[i]
            if (heading.type !== 'heading_open') continue
            const level = Number(heading.tag.slice(1))
            if (level === 1) {
                counters.fill(0)
                stack.length = 1
                continue
            }
            const inline = state.tokens[i + 1]
            if (!inline?.children || level < 2 || level > 6) continue
            counters[level]++
            counters.fill(0, level + 1)
            const title = inline.children
                .filter(t => t.type === 'text' || t.type === 'code_inline')
                .map(t => t.content).join('')
            // 只有前缀完整存在于开头的 text token 中才拆分，保留强调/代码等内联结构。
            const firstText = inline.children.find(t => t.type !== 'strong_open' && t.type !== 'em_open' && !(t.type === 'text' && t.content === ''))
            const match = firstText?.type === 'text' ? firstText.content.match(AUTHOR_NUMBER) : null
            const number = match ? match[0].trim() : counters.slice(2, level + 1).filter(Boolean).join('.')
            const displayTitle = match ? title.slice(match[0].length) : title
            if (match && firstText) firstText.content = firstText.content.slice(match[0].length)

            heading.attrJoin('class', 'rbook-heading')
            heading.attrSet('data-heading-number', number)
            const prefix = new state.Token('html_inline', '', 0)
            prefix.content = `<span class="rbook-heading-number">${md.utils.escapeHtml(number)}</span> <span class="rbook-heading-text">`
            const suffix = new state.Token('html_inline', '', 0)
            suffix.content = '</span>'
            inline.children = [prefix, ...inline.children, suffix]

            if (level <= 3) {
                const entry: OutlineEntry = {
                    level, id: heading.attrGet('id') || slugify(title), number,
                    title: displayTitle, children: [],
                }
                while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop()
                stack[stack.length - 1].children.push(entry)
                stack.push(entry)
            }
        }
    })

    // 使用同一批 heading 的 id 和编号，避免目录自行计算重复锚点或显示 (a)/(b)。
    md.renderer.rules.tocBody = (_tokens, _idx, _options, env) => {
        const escape = md.utils.escapeHtml
        const render = (entries: OutlineEntry[]): string => entries.length
            ? '<ol>' + entries.map(entry => `<li><a href="#${escape(entry.id)}"><span class="rbook-toc-number">${escape(entry.number)}</span> <span>${escape(entry.title)}</span></a>${render(entry.children)}</li>`).join('') + '</ol>'
            : ''
        return render(env.rbookOutline || [])
    }
}
