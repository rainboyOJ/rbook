import MarkdownIt from 'markdown-it'

/**
 * 代码标签页（code tabs）。
 *
 * 语法：**相邻**的两个及以上 fence，info 里带 `[分组名:标签名]`：
 *
 *     ```cpp [g1:C++]
 *     ...
 *     ```
 *     ```python [g1:Python]
 *     ...
 *     ```
 *
 * 同一分组名、彼此相邻的 fence 会被合成一组标签页；分组名不同、或者中间
 * 隔着别的内容（段落、列表边界等），就各自成组。单块成组也照常输出
 * （标签栏只有一项），方便先写好一种语言再补另一种。
 *
 * 生成的结构（面板显隐完全由 CSS 的 `input:checked + div` 决定，
 * 所以没有 JS 也能切换）：
 *
 *     <div class="code-tabs">
 *       <ul class="code-tabs-bar"><li><label for="code-tabs-1-0">C++</label></li>…</ul>
 *       <div class="code-tabs-panes">
 *         <input type="radio" name="code-tabs-1" id="code-tabs-1-0" checked>
 *         <div class="code-tabs-pane" data-label="C++">…代码块…</div>
 *         …
 *       </div>
 *     </div>
 *
 * JS（src/public/js/article.js）只负责把当前标签标成 `.is-active`，
 * 不参与面板显隐；打印时 CSS 会把所有面板展开并写上 data-label。
 */

/** `[分组名:标签名]`，分组名不允许空格/冒号/括号，标签名允许中文与空格。 */
const TABS_INFO_RE = /\[\s*([^[\]:\s]+)\s*:\s*([^[\]]+?)\s*\]/

export interface CodeTabsInfo {
    group: string
    label: string
}

export interface ParsedFenceInfo {
    tabs: CodeTabsInfo | null
    /** 去掉 `[分组名:标签名]` 之后的 info，仍保留语言名与 file= 等属性 */
    rest: string
}

/** 解析 fence info 里的 code-tabs 标记；没有标记时 tabs 为 null。 */
export function parseCodeTabsInfo(info: string): ParsedFenceInfo {
    const raw = info || ''
    const m = TABS_INFO_RE.exec(raw)
    if (!m) return { tabs: null, rest: raw.trim() }
    const label = m[2].trim()
    if (!label) return { tabs: null, rest: raw.trim() }
    const rest = raw.replace(m[0], ' ').replace(/\s+/g, ' ').trim()
    return { tabs: { group: m[1], label }, rest }
}

export interface CodeTabSpec {
    /** 面板 id，同时也是对应 radio 的 id */
    id: string
    label: string
    checked: boolean
}

/** 挂在 fence token 的 meta.codeTabs 上，由 fence 渲染器读取。 */
export interface CodeTabMeta {
    /** 一组共用的 radio name（同一页多组互不干扰） */
    groupName: string
    /** 当前面板自己的标签 */
    spec: CodeTabSpec
    /** 只有组内第一块带整组的标签栏定义 */
    specs?: CodeTabSpec[]
    isLast: boolean
}

export interface CodeTabsPluginOptions {
    /**
     * 注册到核心规则链的哪个规则之后。默认 `block`：
     * 此时 fence token 已经切分完毕，可以安全改写 `info` 与 `meta`。
     * 与 include 插件的先后顺序无所谓——两者只碰 `info` 的不同部分。
     */
    afterRule?: string
}

export default function codeTabsPlugin(md: MarkdownIt, opts: CodeTabsPluginOptions = {}): void {
    md.core.ruler.after(opts.afterRule || 'block', 'rbook_code_tabs', (state) => {
        const tokens = state.tokens
        const env = state.env as Record<string, unknown>
        let seq = typeof env.__rbookCodeTabs === 'number' ? env.__rbookCodeTabs : 0

        for (let i = 0; i < tokens.length; i++) {
            const head = tabsOf(tokens[i])
            if (!head) continue

            // 收集相邻、同组的 fence；遇到别的内容或另一个组就停。
            const run: Array<{ token: typeof tokens[number], info: CodeTabsInfo, rest: string }> = []
            let j = i
            while (j < tokens.length) {
                const cur = tabsOf(tokens[j])
                if (!cur || cur.tabs.group !== head.tabs.group) break
                run.push({ token: tokens[j], info: cur.tabs, rest: cur.rest })
                j++
            }

            seq++
            const groupName = `code-tabs-${seq}`
            const specs: CodeTabSpec[] = run.map((item, k) => ({
                id: `${groupName}-${k}`,
                label: item.info.label,
                checked: k === 0,
            }))

            run.forEach((item, k) => {
                // 去掉标记后再交给高亮器，语言名仍在 info 的第一段。
                item.token.info = item.rest
                item.token.meta = {
                    ...(item.token.meta || {}),
                    codeTabs: {
                        groupName,
                        spec: specs[k],
                        // 只有第一块负责输出标签栏。
                        specs: k === 0 ? specs : undefined,
                        isLast: k === run.length - 1,
                    } satisfies CodeTabMeta,
                }
            })

            i = j - 1
        }

        env.__rbookCodeTabs = seq
        return true
    })
}

/** 只保留“确实带标签标记”的 fence，便于分组时反复判断。 */
function tabsOf(token: { type: string, info: string } | undefined): { tabs: CodeTabsInfo, rest: string } | null {
    if (!token || token.type !== 'fence') return null
    const parsed = parseCodeTabsInfo(token.info)
    if (!parsed.tabs) return null
    return { tabs: parsed.tabs, rest: parsed.rest }
}

/** 属性值转义（标签名可能出现引号）。 */
function escapeAttr(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

/**
 * 把已经渲染好的代码块包成一个标签面板，必要时补上标签栏与容器开关。
 * 由 fence 渲染器调用，保证同一组 token 顺序输出时 HTML 恰好闭合。
 */
export function renderCodeTabPane(meta: CodeTabMeta, codeHtml: string): string {
    let html = ''

    if (meta.specs) {
        const items = meta.specs
            .map(spec => `<li><label for="${spec.id}"${spec.checked ? ' class="is-active"' : ''}>${escapeAttr(spec.label)}</label></li>`)
            .join('')
        html += `<div class="code-tabs" data-code-tabs>\n`
            + `<ul class="code-tabs-bar" aria-label="代码版本">${items}</ul>\n`
            + `<div class="code-tabs-panes">\n`
    }

    html += `<input type="radio" class="code-tabs-radio" name="${meta.groupName}" id="${meta.spec.id}"`
        + `${meta.spec.checked ? ' checked' : ''}>\n`
        + `<div class="code-tabs-pane" data-label="${escapeAttr(meta.spec.label)}">\n`
        + `${codeHtml}\n`
        + `</div>\n`

    if (meta.isLast) html += `</div>\n</div>\n`

    return html
}
