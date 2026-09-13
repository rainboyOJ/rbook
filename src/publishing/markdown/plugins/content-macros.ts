import MarkdownIt from 'markdown-it'
import ejs from 'ejs'
import type { Diagnostic } from '../../domain/diagnostics'

export interface ContentMacrosOptions {
    locals?: Record<string, unknown>
    root?: string
    filename?: string
    diagnostics?: Diagnostic[]
    helpers?: Record<string, (...args: unknown[]) => string>
    rojBaseUrl?: string
}

export function createDefaultHelpers(rojBaseUrl = 'https://roj.ac.cn') {
    const base = rojBaseUrl.endsWith('/') ? rojBaseUrl : `${rojBaseUrl}/`
    return {
        pid_to_url(oj_name: string, id: string | number, title: string) {
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

        const defaultHelpers = createDefaultHelpers(opts.rojBaseUrl)
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