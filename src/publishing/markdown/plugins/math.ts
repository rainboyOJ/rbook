import MarkdownIt, { type Token } from 'markdown-it'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const texmath = require('markdown-it-texmath')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const katex = require('katex')
import type { Diagnostic } from '../../domain/diagnostics'

export interface MathPluginOptions {
    diagnostics?: Diagnostic[]
    /**
     * 当前文档路径（渲染时从 env.currentMdFilePath 取，这里作为兜底）。
     * 用于把 KaTeX 的 strict 警告归因到具体文件。
     */
    currentFile?: string
}

const KATEX_BASE_OPTIONS = {
    macros: { '\\R': '\\mathbb{R}' },
    throwOnError: false,
}

/** KaTeX 的 strict 警告形如 "LaTeX-incompatible input ... : <描述> [ruleId]" */
function isKatexWarning(text: string): boolean {
    return /LaTeX-incompatible input|strict mode/.test(text)
}

/**
 * 当前正在渲染的文件路径。
 *
 * 为什么用模块级变量：markdown-it-texmath 会把 engine 缓存到它自己的模块级
 * 变量上（`if (!texmath.katex)`），因此全局只会有第一个 engine 生效。
 * 归因所需的“当前文件”因此不能放在每个插件实例的闭包里（会变成首次渲染的
 * 陈旧值），必须由一个模块级指针在每次渲染时刷新。
 */
let activeFile: string | undefined

/** 把 KaTeX 警告整理成一行可读描述（去前缀与末尾 ruleId）。 */
export function cleanKatexMessage(raw: string): string {
    return String(raw)
        .replace(/^LaTeX-incompatible input and strict mode is set to '(?:warn|error)':\s*/, '')
        .replace(/\s*\[[a-zA-Z]+\]\s*$/, '')
        .trim()
}

/**
 * 包装 KaTeX，把它的 strict 警告（原本只走 console.warn，不带任何文件信息）
 * 转成带 sourcePath 的 Diagnostic，从而能定位是哪个 md 出的问题。
 *
 * 同时保留原始 console.warn 行为吗？不保留——否则构建日志会继续刷屏且
 * 无法定位。诊断会在 reportDiagnostics 里统一按文件输出。
 */
function createReportingEngine(
    diagnostics: Diagnostic[],
    fallbackFile?: string,
): { renderToString: (tex: string, options?: Record<string, unknown>) => string } {
    return {
        renderToString(tex: string, options: Record<string, unknown> = {}) {
            const messages: string[] = []
            const origWarn = console.warn
            console.warn = (...args: unknown[]) => {
                const text = args.map(a => String(a)).join(' ')
                if (isKatexWarning(text)) messages.push(text)
                else origWarn.apply(console, args as [])
            }

            let html: string
            try {
                html = katex.renderToString(tex, {
                    ...KATEX_BASE_OPTIONS,
                    ...options,
                    strict: 'warn',
                })
            }
            finally {
                console.warn = origWarn
            }

            const sourcePath = activeFile || fallbackFile
            for (const raw of messages) {
                diagnostics.push({
                    phase: 'latex',
                    level: 'warning',
                    sourcePath,
                    message: cleanKatexMessage(raw),
                    // 把出错公式的前若干字符带上，便于直接定位
                    suggestion: `公式: ${tex.trim().replace(/\s+/g, ' ').slice(0, 80)}`,
                })
            }

            return html
        },
    }
}

/**
 * 检测“本该是显示公式、却漏成了正文”的 `$$`。
 *
 * markdown-it-texmath 的块级正则 `\${2}([^$]*?[^\\])\${2}` 既不允许
 * `$$` 内部再出现 `$`，也要求闭合 `$$` 前不能是反斜杠。一旦不满足，
 * texmath 不报错、不抛异常，只是不再生成公式 token —— 于是 `$$` 被当成
 * 普通文字渲染出来。这正是项目禁止的“静默丢内容”，必须在构建期可见。
 */
function detectLeakedDisplayMath(
    tokens: Token[],
    sourcePath: string | undefined,
    diagnostics: Diagnostic[],
): void {
    const report = (line: number | undefined, snippet: string) => {
        diagnostics.push({
            phase: 'latex',
            level: 'warning',
            sourcePath,
            line,
            message: '显示公式 $$ 未被解析，已按普通文字输出',
            suggestion: `常见原因: ① $$ 内部又写了 $（内联公式下标不需要 $）；② 闭合 $$ 前是反斜杠；③ 代码围栏未闭合把公式吞进了代码块。片段: ${snippet}`,
        })
    }

    for (const token of tokens) {
        if (token.type !== 'inline' || !token.children) continue
        // 一个段落里可能有多处漏解析，只报第一处，避免同一段重复刷屏。
        const leaked = token.children.find(child => child.type === 'text' && child.content.includes('$$'))
        if (!leaked) continue
        const base = (token.map && token.map[0]) || 0
        const idx = token.content.indexOf('$$')
        const line = idx >= 0 ? base + token.content.slice(0, idx).split('\n').length : base + 1
        report(line, leaked.content.trim().replace(/\s+/g, ' ').slice(0, 60))
    }
}

/** 把行内代码 span（`x` / ``x``）替换成占位符，避免把代码里的 $ 当真公式。 */
function maskInlineCode(line: string): string {
    return line.replace(/(`+)([^`]*?)\1/g, m => '\u0001'.repeat(m.length))
}

/**
 * 检测 texmath 行内规则认不出的 `$...$`。
 *
 * 行内正则 `\$((?:[^\s\\])|(?:\S.*?[^\s\\]))\$` 要求：
 *   ① 紧跟在开 `$` 后的字符不能是空白；
 *   ② 紧邻闭 `$` 前的字符不能是空白，也不能是反斜杠。
 * 不满足时 texmath 不报错也不抛异常，只是不生成公式 token —— 于是 `$ x $`
 * 会原样变成页面上的字面 `$ x $`。同样属于“静默丢内容”。
 */
function detectBrokenInlineMath(src: string, sourcePath: string | undefined, diagnostics: Diagnostic[]): void {
    const lines = src.split('\n')
    let inFence = false
    let inPseudocode = false
    const reported = new Set<string>()

    lines.forEach((line, i) => {
        if (/^\s*```/.test(line)) { inFence = !inFence; return }
        if (inFence) return
        // ::: pseudocode ... ::: 里是伪代码，$ 是作者自己的记号，不是 markdown 数学。
        if (/^\s*:::\s*pseudocode\b/.test(line)) { inPseudocode = true; return }
        if (inPseudocode) {
            if (/^\s*:::\s*$/.test(line)) inPseudocode = false
            return
        }

        // 先把 $$ 显示定界符与行内代码屏蔽，避免误判。
        const masked = maskInlineCode(line).replace(/\$\$/g, '\u0000\u0000')
        const re = /\$([^$\u0000\u0001]*)\$/g
        let m: RegExpExecArray | null
        while ((m = re.exec(masked))) {
            const inner = m[1]
            if (inner.length === 0) continue
            if (!/^\s/.test(inner) && !/\s$/.test(inner) && !/\\$/.test(inner)) continue
            const snippet = line.slice(m.index, m.index + m[0].length).slice(0, 60)
            const key = `${i}:${snippet}`
            if (reported.has(key)) continue
            reported.add(key)
            diagnostics.push({
                phase: 'latex',
                level: 'warning',
                sourcePath,
                line: i + 1,
                message: '行内公式 $...$ 未被解析，已按字面文字输出',
                suggestion: `texmath 要求 $ 内侧不能紧贴空白或反斜杠，改成 $${inner.trim()}$。片段: ${snippet}`,
            })
        }
    })
}

export default function mathPlugin(md: MarkdownIt, opts: MathPluginOptions = {}): void {
    const diagnostics = opts.diagnostics || []
    if (opts.currentFile) activeFile = opts.currentFile

    const engine = createReportingEngine(diagnostics, opts.currentFile)

    // 每次渲染开始时刷新当前文件，供 engine 归因使用。
    md.core.ruler.before('normalize', 'rbook_math_file_context', function mathFileContext(state) {
        const env = (state.env || {}) as Record<string, unknown>
        activeFile = (env.currentMdFilePath as string) || opts.currentFile
        return true
    })

    // 在 inline 解析之后检查有没有 $$ 漏成正文、$...$ 没被认出来。
    md.core.ruler.after('inline', 'rbook_math_leak_check', function mathLeakCheck(state) {
        detectLeakedDisplayMath(state.tokens, activeFile, diagnostics)
        detectBrokenInlineMath(state.src, activeFile, diagnostics)
        return true
    })

    md.use(texmath, {
        engine,
        delimiters: 'dollars',
        katexOptions: {
            macros: { '\\R': '\\mathbb{R}' },
            throwOnError: false,
        },
    })
}
