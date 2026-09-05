import MarkdownIt from 'markdown-it'
import { registerPlugins } from './plugin-registry'
import { RbookLinkOptions } from './plugins/rbook-link'
import { ExcalidrawOptions } from './plugins/excalidraw'
import { ArticleIndex } from '../domain/metadata'
import { ProblemProvider } from '../integrations/problem-provider'
import { Diagnostic } from '../domain/diagnostics'

export interface RendererOptions {
    index: ArticleIndex
    problemProvider?: ProblemProvider
    blogUrl?: string
    rojBaseUrl?: string
    diagnostics?: Diagnostic[]
    debug?: boolean
    excalidraw?: ExcalidrawOptions
}

export interface RenderResult {
    header: { title: string }
    content: string
    diagnostics: Diagnostic[]
}

export function createMarkdownRenderer(opts: RendererOptions): MarkdownIt {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
    })

    const linkOpts: RbookLinkOptions = {
        index: opts.index,
        problemProvider: opts.problemProvider,
        blogUrl: opts.blogUrl,
        rojBaseUrl: opts.rojBaseUrl,
        diagnostics: opts.diagnostics,
        debug: opts.debug,
    }

    registerPlugins(md, {
        rbookLink: linkOpts,
        excalidraw: opts.excalidraw,
    })

    return md
}

export function renderMarkdown(raw: string, md: MarkdownIt, env?: Record<string, unknown>): { header: { title: string }, content: string } {
    const lines = raw.split('\n')
    let header = { title: '' }
    let body = raw

    if (lines[0] && lines[0].trim() === '---') {
        const endIdx = lines.indexOf('---', 1)
        if (endIdx > 1) {
            const fmLines = lines.slice(1, endIdx)
            body = lines.slice(endIdx + 1).join('\n')
            for (const line of fmLines) {
                const m = line.match(/^title\s*:\s*(.+)$/i)
                if (m) header.title = m[1].trim()
            }
        }
    }

    const content = md.render(body, env || {})
    return { header, content }
}