import MarkdownIt from 'markdown-it'
import type { RbookLinkOptions } from './rbook-link'
import type { ProblemProvider } from '../../integrations/problem-provider'

export default function problemListPlugin(md: MarkdownIt, opts: RbookLinkOptions): void {
    md.block.ruler.before('list', 'problem_list', function problemListParse(state, startLine, endLine, silent) {
        const content = state.getLines(startLine, startLine + 1, state.blkIndent, false).trim()
        const pListReg = /^\+p\s+.+/i
        if (!pListReg.test(content)) return false

        if (!silent) {
            const token = state.push('problem_list_open', 'div', 1)
            token.attrs = [['class', 'problem_list_content']]

            const itemToken = state.push('problem_list_item', 'span', 0)
            const parts = content.replace(/^\+p\s*/i, '').split(' ')
            itemToken.meta = parts

            state.push('problem_list_close', 'div', -1)
        }
        state.line = state.skipEmptyLines(startLine + 1)
        return true
    })

    md.renderer.rules.problem_list_item = (tokens, idx) => {
        const args = tokens[idx].meta as string[]
        let id = args[0]
        if (id === 'THIS_ID') {
            const env = (tokens[idx] as any)._env
            id = (env && env.id) || id
        }

        if (!opts.problemProvider || !opts.problemProvider.getProblemsForArticle) {
            return `<div class="problem_list_content">题目列表 (provider 未配置: id=${id})</div>`
        }

        const problems = opts.problemProvider.getProblemsForArticle(id)
        if (!problems || problems.length === 0) {
            return `<div class="problem_list_content"><p>暂无题目</p></div>`
        }

        const lis = problems.map(p => {
            const link = `${(opts.rojBaseUrl || 'https://roj.ac.cn')}${p.link}`
            return `<li><a href="${link}" target="_blank">${p.oj} ${p.sid}: ${p.title}</a></li>`
        }).join('\n')

        return `<div class="problem_list_content"><ul>${lis}</ul></div>`
    }
}