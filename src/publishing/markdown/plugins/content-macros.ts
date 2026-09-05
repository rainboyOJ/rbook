import MarkdownIt from 'markdown-it'
import ejs from 'ejs'
import type { Diagnostic } from '../../domain/diagnostics'

export interface ContentMacrosOptions {
    /** 限制可访问的 locals，防止 EJS 模板读取任意文件 */
    locals?: Record<string, unknown>
    /** 允许 include 的根目录 */
    root?: string
    /** 当前渲染的文章源路径（用于相对 include） */
    filename?: string
    diagnostics?: Diagnostic[]
    /** 渲染宏时用的辅助函数 */
    helpers?: Record<string, (...args: unknown[]) => string>
}

const MACRO_REGEX = /<%-([\s\S]*?)%>/g

export default function contentMacrosPlugin(md: MarkdownIt, opts: ContentMacrosOptions): void {
    md.core.ruler.before('normalize', 'rbook_content_macros', function macrosPreprocess(state) {
        const allLocals = {
            ...(opts.locals || {}),
            ...(opts.helpers || {}),
        }

        const processed = state.src.replace(MACRO_REGEX, (match, body) => {
            opts.diagnostics?.push({
                phase: 'content-macros',
                level: 'warning',
                message: 'EJS 内容宏已弃用，请迁移到新语法',
                suggestion: 'content macros will be removed after migration',
            })
            try {
                return ejs.render(`<%-${body}%>`, allLocals, {
                    filename: opts.filename,
                    root: opts.root,
                })
            }
            catch (err) {
                opts.diagnostics?.push({
                    phase: 'content-macros',
                    level: 'error',
                    message: `EJS 宏渲染失败: ${err instanceof Error ? err.message : String(err)}`,
                })
                return ''
            }
        })

        state.src = processed
        return true
    })
}