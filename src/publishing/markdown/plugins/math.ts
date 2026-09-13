import MarkdownIt from 'markdown-it'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const texmath = require('markdown-it-texmath')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const katex = require('katex')
import type { Diagnostic } from '../../domain/diagnostics'

export interface MathPluginOptions {
    diagnostics?: Diagnostic[]
}

export default function mathPlugin(md: MarkdownIt, opts: MathPluginOptions = {}): void {
    md.use(texmath, {
        engine: katex,
        delimiters: 'dollars',
        katexOptions: {
            macros: { '\\R': '\\mathbb{R}' },
            throwOnError: false,
        },
    })
}
