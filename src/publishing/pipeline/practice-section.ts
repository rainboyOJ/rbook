import { PracticeProblem } from '../integrations/pcs2-practice-provider'

/**
 * 文章末尾自动生成的「相关题解」小节。
 *
 * 标题刻意用「相关题解」而不是「练习题目」：book/ 里已有 49 篇文章手写了
 * 「练习题目 / 题目 / 题目列表」小节，用不同标题可以让自动内容与人工内容并存，
 * 不会出现两个同名 H2、也不会在右侧目录里重复。
 */
export const PRACTICE_SECTION_HEADING = '## 相关题解'

/** 一篇没有关联题解时显示的文字。 */
export const PRACTICE_EMPTY_TEXT = '暂无相关题解'

/** 题目链接在新标签页打开，与本仓库 [[[p: ...]]] 生成的链接行为一致。 */
const LINK_TARGET = 'target="_blank" rel="noopener noreferrer"'

/** 生成 Markdown（而不是 HTML），这样标题能进入 TOC，表格也能套用现有 .markdown-body 样式。 */
export function buildPracticeSection(problems: PracticeProblem[]): string {
    const lines = [PRACTICE_SECTION_HEADING, '']

    if (problems.length === 0) {
        lines.push(PRACTICE_EMPTY_TEXT)
        return lines.join('\n')
    }

    lines.push('| 题目 | OJ | 难度 |', '| --- | --- | --- |')
    for (const problem of problems) {
        const title = escapeCell(problem.title) || escapeCell(problem.problemId)
        const oj = escapeCell(problem.oj)
        const difficulty = escapeCell(problem.difficulty) || '未知'
        // 表格单元格里内联 HTML：Markdown 链接语法无法表达 target，而本仓库
        // 所有题目链接都要求新标签页打开，避免把读者带离当前文章。
        const link = `<a href="${escapeAttribute(problem.url)}" ${LINK_TARGET}>${title}</a>`
        lines.push(`| ${link} | ${oj} | ${difficulty} |`)
    }
    return lines.join('\n')
}

/** 把小节拼到正文末尾；保证前面至少一个空行，Markdown 才会把它当成新块。 */
export function appendPracticeSection(raw: string, section: string): string {
    return `${raw.replace(/\s+$/, '')}\n\n${section}\n`
}

/** HTML 文本与属性值的转义。 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

/** 属性值只多处理换行，避免把标签拆断。 */
function escapeAttribute(value: string): string {
    return escapeHtml(value).replace(/\r?\n/g, ' ')
}

/**
 * 表格单元格转义。
 * 标题里真实出现过 `[USACO08DEC] Secret Message G` 这类方括号，放进 HTML 文本
 * 不需要转义；真正会拆坏表格的是 `|`，必须写成 `\|` 交给 Markdown 的表格切分器。
 */
function escapeCell(value: string): string {
    return escapeHtml(value)
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ')
        .trim()
}
