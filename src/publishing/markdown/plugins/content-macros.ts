import MarkdownIt from 'markdown-it'
import ejs from 'ejs'
import type { Diagnostic } from '../../domain/diagnostics'
import type { ProblemUrlResolver } from '../../integrations/problem-url'

export interface ContentMacrosOptions {
    locals?: Record<string, unknown>
    root?: string
    filename?: string
    diagnostics?: Diagnostic[]
    helpers?: Record<string, (...args: unknown[]) => string>
    rojBaseUrl?: string
    /** 题目 URL/标题解析器；提供后 pid_to_url 会产出正确链接 */
    problemUrl?: ProblemUrlResolver
}

export function createDefaultHelpers(rojBaseUrl = 'https://roj.ac.cn', problemUrl?: ProblemUrlResolver) {
    const base = rojBaseUrl.endsWith('/') ? rojBaseUrl : `${rojBaseUrl}/`
    return {
        /**
         * 旧内容宏：pid_to_url(oj, id, title)
         * 有解析器时走统一路由（roj -> roj.ac.cn，其余 -> pcs2，缺失回退官方站），
         * 否则退回旧行为（拼接 {base}{oj}/{id}，该形式已全面 404）。
         */
        pid_to_url(oj_name: string, id: string | number, title: string) {
            if (problemUrl) {
                const r = problemUrl.resolve(String(oj_name), String(id), String(title))
                const text = r.title || String(title) || `${r.normalizedOj} ${r.normalizedPid}`
                return `<a href="${r.url}" target="_blank">${r.normalizedOj} ${r.normalizedPid} : ${text}</a>`
            }
            const url = `${base}${oj_name}/${id}`
            const text = `${oj_name} ${id} : ${title}`
            return `<a href="${url}" target="_blank">${text}</a>`
        },
        video(src: string) {
            const filename = src.endsWith('.mp4') ? src : `${src}.mp4`
            return `<video width="800" loop controls autoplay src="/video/${filename}" type="video/mp4">Your browser does not support the video tag. </video>`
        },
        dvideo(src: string) {
            const filename = src.endsWith('.mp4') ? src : `${src}.mp4`
            return `<video width="800" loop controls autoplay src="https://d.roj.ac.cn/d/RainboyVideo/${filename}" type="video/mp4">Your browser does not support the video tag. </video>`
        },
        iframe(src: string, height = 800) {
            return `<div class="iframe-container">\n<a href="${src}" target="_blank">新标签打开</a>\n<iframe height="${height}" frameborder="1" src="${src}"></iframe>\n</div>\n`
        },
    }
}

export default function contentMacrosPlugin(md: MarkdownIt, opts: ContentMacrosOptions = {}): void {
    md.core.ruler.before('normalize', 'rbook_content_macros', function macrosPreprocess(state) {
        if (!state.src.includes('<%')) return true

        const env = (state.env || {}) as Record<string, unknown>
        const currentFile = (env.currentMdFilePath as string) || opts.filename
        const root = (env.root as string) || opts.root
        const envData = (env.data || {}) as Record<string, unknown>

        const defaultHelpers = createDefaultHelpers(opts.rojBaseUrl, opts.problemUrl)
        const allLocals = {
            ...defaultHelpers,
            ...(opts.locals || {}),
            ...(opts.helpers || {}),
            ...envData,
        }

        opts.diagnostics?.push({
            phase: 'content-macros',
            level: 'warning',
            sourcePath: currentFile,
            message: 'EJS 内容宏已弃用，请迁移到新语法',
            suggestion: 'content macros will be removed after migration',
        })

        try {
            state.src = ejs.render(state.src, allLocals, {
                filename: currentFile,
                root,
            })
        }
        catch (err) {
            opts.diagnostics?.push({
                phase: 'content-macros',
                level: 'warning',
                sourcePath: currentFile,
                message: `EJS 宏渲染失败: ${err instanceof Error ? err.message : String(err)}`,
            })
        }

        return true
    })
}