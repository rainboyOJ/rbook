import fs from 'fs'
import path from 'path'
import MarkdownIt from 'markdown-it'
import type { Diagnostic } from '../../domain/diagnostics'

/**
 * 内容包含（include）插件 —— 旧 EJS `<%- include("...") %>` 的替代实现。
 *
 * 两种写法：
 *   1. fence 内（代码/文本文件）：
 *        ```cpp file=./code/n3.cpp
 *        ```
 *      内容取自文件，交给已有的 fence 渲染器做高亮 + 复制按钮，
 *      外观与直接写代码块完全一致。
 *   2. fence 外（Markdown 片段）：
 *        [[[include: ./problem.md]]]
 *      片段文本内联回父文档，由父文档的 markdown 解析器继续解析
 *      （与旧 EJS 的预处理语义等价），支持嵌套。
 *
 * 与旧实现的有意差异：
 *  - 路径受限于白名单根目录（book/ 与 algo_template/），越界即报错
 *  - 目标不存在 / 越界 / 嵌套过深都是 error 级诊断，并在页面上渲染
 *    可见的失败标记，绝不静默丢内容
 */

export interface IncludeOptions {
    /** 允许访问的根目录（绝对路径）；绝对路径写法从这里解析 */
    roots: string[]
    /**
     * 绝对路径写法的基准目录（通常是项目根）。
     * 旧 EJS 的 `include("/algo_template/...")` 是相对 EJS `root` 解析的，
     * 这里保持一致：`/x` -> `<projectRoot>/x`，再校验是否落在 roots 内。
     * 缺省时取 roots 的公共父目录。
     */
    projectRoot?: string
    /** 当前文档绝对路径，用于解析相对路径 */
    currentFile?: string
    diagnostics?: Diagnostic[]
    /** 最大包含深度，防御自包含/环 */
    maxDepth?: number
}

export interface ResolvedInclude {
    absPath: string
    content: string
}

/** fence 外 include：[[[include: ./x.md]]] */
const INCLUDE_RE = /\[\[\[\s*include\s*:\s*([^\]]+?)\s*\]\]\]/g

/**
 * 遗留的 EJS include 写法：<%- include("./x.md") %> / <%-include("x") _%> 等。
 * 过渡期两种写法可能混在同一个片段里（父文档已迁移、片段未迁移，或反之），
 * 因此这里一并展开，使迁移不再依赖顺序、也不会出现内容缺口。
 *
 * 捕获末尾的 slurp 标记（`_%>` / `-%>`）：EJS 会连带吃掉其后的换行。
 * 这在 fence 内很关键——决定代码块内容末尾是否多一个空行。
 */
const LEGACY_EJS_INCLUDE_RE = /<%[-=]?\s*include\(\s*["']([^"']+)["']\s*\)\s*([-_]?)%>(\r?\n)?/g

/** 同上，但不带 g（仅用于存在性检测，无 lastIndex 状态）。 */
const LEGACY_EJS_INCLUDE_TEST_RE = /<%[-=]?\s*include\(\s*["'][^"']+["']\s*\)\s*[-_]?%>/

/** fence info 里的 file= 属性，例如 ```cpp file=./x.cpp */
const FENCE_FILE_RE = /(?:^|\s)file\s*=\s*(?:"([^"]+)"|'([^']+)'|(\S+))/

export class IncludeResolver {
    private readonly roots: string[]
    private readonly projectRoot: string
    private readonly diagnostics: Diagnostic[]
    private readonly maxDepth: number
    private readonly defaultFile?: string
    /** 已经报过“遗留写法”警告的文件，避免同一文件刷屏 */
    private readonly legacyWarned = new Set<string>()

    constructor(opts: IncludeOptions) {
        this.roots = opts.roots.map(r => path.resolve(r))
        this.projectRoot = path.resolve(opts.projectRoot || commonAncestor(this.roots) || process.cwd())
        this.diagnostics = opts.diagnostics || []
        this.maxDepth = opts.maxDepth ?? 5
        this.defaultFile = opts.currentFile
    }

    /**
     * 解析 include 目标路径，返回绝对路径。
     * 失败时记录 error 诊断并返回 null（调用方据此渲染可见的失败标记）。
     */
    resolve(target: string, fromFile?: string, depth = 0): string | null {
        const base = fromFile || this.defaultFile

        if (depth > this.maxDepth) {
            this.error(target, `include 嵌套超过 ${this.maxDepth} 层（可能存在自包含/环）`, base)
            return null
        }

        let abs: string
        if (path.isAbsolute(target)) {
            // 与旧 EJS 一致：绝对写法相对 projectRoot 解析
            abs = path.resolve(this.projectRoot, target.replace(/^\//, ''))
        }
        else {
            if (!base) {
                this.error(target, 'include 使用相对路径，但当前文档路径未知', base)
                return null
            }
            abs = path.resolve(path.dirname(base), target)
        }

        abs = path.normalize(abs)

        if (!this.isInsideRoots(abs)) {
            this.error(target, `include 路径越界，只允许访问 ${this.roots.join(', ')}`, base)
            return null
        }
        if (!fs.existsSync(abs)) {
            this.error(target, 'include 目标文件不存在', base)
            return null
        }
        if (fs.statSync(abs).isDirectory()) {
            this.error(target, 'include 目标是目录，不是文件', base)
            return null
        }

        return abs
    }

    read(target: string, fromFile?: string, depth = 0): ResolvedInclude | null {
        const abs = this.resolve(target, fromFile, depth)
        if (!abs) return null
        // 统一换行符为 LF，与 markdown-it 的 normalize 规则保持一致
        // （CommonMark 规定 \r\n 与 \r 都等同 \n）。
        // 否则 file= 注入的内容会绕过 normalize，在产物里留下 CR，
        // 与旧 EJS 路径的行为不一致。
        return { absPath: abs, content: normalizeNewlines(fs.readFileSync(abs, 'utf8')) }
    }

    /**
     * 递归展开文本里的所有 include（新语法与遗留 EJS 写法）。
     * 被包含的 .md 片段自身可以再含 include（旧实现依赖 EJS 递归渲染）。
     */
    expandInline(text: string, fromFile?: string, depth = 0): string {
        const hasNew = text.includes('[[[include')
        const hasLegacy = text.includes('include(') && text.includes('<%')
        if (!hasNew && !hasLegacy) return text

        if (depth > this.maxDepth) {
            this.error('include', `include 嵌套超过 ${this.maxDepth} 层`, fromFile)
            return text
        }

        const expandOne = (target: string): string => {
            const resolved = this.read(target, fromFile, depth)
            if (!resolved) return renderIncludeFailure(target)
            // 片段里的相对路径要相对于片段自身解析
            return this.expandInline(resolved.content, resolved.absPath, depth + 1)
        }

        let out = text.replace(INCLUDE_RE, (_w, rawTarget: string) => expandOne(unquote(rawTarget.trim())))

        // 遗留 EJS include：为过渡期兼容而继续展开，但仍要发出弃用警告，
        // 否则插件接管后警告会消失，Phase 3 的迁移进度就无法从构建输出看出。
        // 用不带 g 的副本做检测，避免全局正则 lastIndex 的隐式状态。
        if (LEGACY_EJS_INCLUDE_TEST_RE.test(text)) {
            this.warnLegacy(fromFile)
        }
        out = out.replace(LEGACY_EJS_INCLUDE_RE, (_w, rawTarget: string, slurp: string, newline: string) => {
            const expanded = expandOne(rawTarget.trim())
            // slurp（_%> / -%>）会吃掉后面的换行；普通 %> 保留
            const isSlurp = slurp === '_' || slurp === '-'
            return expanded + (isSlurp ? '' : (newline || ''))
        })
        return out
    }

    private isInsideRoots(abs: string): boolean {
        return this.roots.some(root => abs === root || abs.startsWith(root + path.sep))
    }

    private error(target: string, reason: string, fromFile?: string): void {
        this.diagnostics.push({
            phase: 'include',
            level: 'error',
            sourcePath: fromFile,
            message: `include 失败: ${target} (${reason})`,
        })
    }

    /** 每个文件只报一次“仍在使用遗留 EJS include 写法”。 */
    private warnLegacy(fromFile?: string): void {
        const key = fromFile || '<unknown>'
        if (this.legacyWarned.has(key)) return
        this.legacyWarned.add(key)
        this.diagnostics.push({
            phase: 'include',
            level: 'warning',
            sourcePath: fromFile,
            message: '仍在使用的 EJS include 写法已弃用，请迁移到 ```lang file=... 或 [[[include: ...]]]',
            suggestion: 'fence 内用 ```cpp file=./x.cpp；fence 外用 [[[include: ./x.md]]]',
        })
    }
}

function unquote(s: string): string {
    return s.replace(/^["']|["']$/g, '')
}

/** 按 CommonMark 的换行规范把 \r\n 与 \r 统一为 \n。 */
function normalizeNewlines(s: string): string {
    return s.replace(/\r\n?/g, '\n')
}

/** 取一组路径的公共父目录（用于推导绝对路径基准）。 */
function commonAncestor(paths: string[]): string | null {
    if (paths.length === 0) return null
    const split = paths.map(p => p.split(path.sep))
    const first = split[0]
    const out: string[] = []
    for (let i = 0; i < first.length; i++) {
        if (split.every(s => s[i] === first[i])) out.push(first[i])
        else break
    }
    const joined = out.join(path.sep)
    return joined || path.sep
}

/** 从 fence 的 info 字符串里取出 file= 目标。 */
export function parseFenceFileTarget(info: string): string | null {
    const m = FENCE_FILE_RE.exec(info || '')
    if (!m) return null
    return m[1] || m[2] || m[3] || null
}

/** include 失败时的可见标记，便于在页面上发现而非静默。 */
function renderIncludeFailure(target: string): string {
    const safe = target.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<span class="include-missing" title="include 失败">[include 失败: ${safe}]</span>`
}

export default function includePlugin(md: MarkdownIt, opts: IncludeOptions): void {
    const resolver = new IncludeResolver(opts)

    const envFile = (state: { env?: unknown }): string | undefined => {
        const env = (state.env || {}) as Record<string, unknown>
        return (env.currentMdFilePath as string) || opts.currentFile
    }

    // 1) fence 外 include：必须在 normalize 之前改写 state.src，
    //    让内联进来的 markdown 参与正常的块级解析。
    md.core.ruler.before('normalize', 'rbook_inline_include', function inlineInclude(state) {
        if (!state.src.includes('include')) return true
        state.src = resolver.expandInline(state.src, envFile(state))
        return true
    })

    // 2) fence 内 include：必须在 block 解析之后（此时 fence token 才存在），
    //    又要在 inline 之前，把文件内容填进 token.content。
    md.core.ruler.after('block', 'rbook_fence_include', function fenceInclude(state) {
        for (const token of state.tokens) {
            if (token.type !== 'fence') continue
            const target = parseFenceFileTarget(token.info)
            if (!target) continue

            const resolved = resolver.read(target, envFile(state))
            if (!resolved) {
                token.info = stripFenceFileAttr(token.info)
                token.content = renderIncludeFailure(target)
                continue
            }
            // 去掉 file= 属性，否则会被当成语言名交给高亮器
            token.info = stripFenceFileAttr(token.info)
            token.content = resolved.content
        }
        return true
    })
}

/** 从 fence info 里去掉 file= 属性，保留语言名等其它信息。 */
export function stripFenceFileAttr(info: string): string {
    return (info || '')
        .replace(FENCE_FILE_RE, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
