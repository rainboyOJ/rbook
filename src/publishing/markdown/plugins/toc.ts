import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
const toc = require('markdown-it-toc-done-right')

/** 目录和标题共用锚点规则，保留中文，并为纯符号标题提供回退。 */
function slugify(title: string): string {
    return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '') || 'section'
}

export default function tocPlugin(md: MarkdownIt): void {
    const options = { level: [2, 3], slugify }
    md.use(anchor, options)
    md.use(toc, options)
}
