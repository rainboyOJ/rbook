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

/** 生成 Markdown（而不是 HTML），这样标题能进入 TOC，表格也能套用现有 .markdown-body 样式。 */
export function buildPracticeSection(problems: PracticeProblem[]): string {
    const lines = [PRACTICE_SECTION_HEADING, '']

    if (problems.length === 0) {
        lines.push(PRACTICE_EMPTY_TEXT)
        return lines.join('\n')
    }

    lines.push('| 题目 | OJ | 难度 |', '| --- | --- | --- |')
    for (const problem of problems) {
        const title = escapeInline(problem.title) || escapeInline(problem.problemId)
        const oj = escapeInline(problem.oj)
        const difficulty = escapeInline(problem.difficulty) || '未知'
        lines.push(`| [${title}](${problem.url}) | ${oj} | ${difficulty} |`)
    }
    return lines.join('\n')
}

/** 把小节拼到正文末尾；保证前面至少一个空行，Markdown 才会把它当成新块。 */
export function appendPracticeSection(raw: string, section: string): string {
    return `${raw.replace(/\s+$/, '')}\n\n${section}\n`
}

/**
 * 单元格与链接文字共用的转义。
 * 题解标题里真实出现过 `[USACO08DEC] Secret Message G` 这类方括号，
 * 不转义会把链接拆坏；`|` 会把表格拆坏。
 */
function escapeInline(value: string): string {
    return value
        .replace(/\\/g, '\\\\')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\|/g, '\\|')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\r?\n/g, ' ')
        .trim()
}
