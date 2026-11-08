/**
 * 文章标题：正文与菜单分两轨。
 *
 * 菜单栏窄，正文标题可以长，所以一篇文章允许两个名字，各有唯一出处：
 *
 *     正文：config.yaml title  → md front matter title → catalog.yaml title
 *     菜单：config.yaml menu_title（可选）→ catalog.yaml title
 *
 * - 页面 `<title>` 与正文 H1、`dist/catalog.json`：`resolveArticleTitle()`
 * - 侧边栏：`resolveMenuTitle()`，由 MenuRenderer 的 `leafMeta` 传进去
 *
 * `menu_title` 没写就沿用 `catalog.yaml` 里的短名——存量 144 篇今天都写在那里，
 * 不需要迁移。因此同一页出现「菜单短名」与「正文长名」是预期行为，不是 bug；
 * 真正的 bug 是同一份名字在两处漂移，那由「每个名字只有一个出处」保证。
 *
 * 决定见 docs/adr/0012-dual-track-article-titles.md。
 *
 * 注意 `header.title` 不是 md 的第一个 H1，而是 renderMarkdown 从 md 的 YAML
 * frontmatter 里读出来的 `title:`（见 markdown/create-markdown-renderer.ts）。
 */
export interface ArticleTitleInput {
    /** 文章目录 config.yaml 里的 title */
    metadataTitle?: string
    /** md frontmatter 里的 title（renderMarkdown 的 header.title） */
    headerTitle?: string
    /** catalog.yaml 里的导航标题，只在前两者都为空时兜底 */
    catalogTitle?: string
}

const LAST_RESORT = '未知'

export function resolveArticleTitle(input: ArticleTitleInput): string {
    for (const candidate of [input.metadataTitle, input.headerTitle, input.catalogTitle]) {
        const value = (candidate ?? '').trim()
        if (value) return value
    }
    // 只在不经过 catalog 的零星调用里兜底（例如单文件渲染一个还没进目录的草稿）。
    return LAST_RESORT
}

/**
 * 标题是否靠兜底而来（既没有 config.title，也没有 frontmatter title）。
 *
 * 这类文章在页面和侧边栏上都只能用 catalog 导航名，内容作者应当补一个真标题；
 * 这个判定被 `npm run check:catalog` 用来列出待补标题的文章。
 */
export function titleNeedsAuthoring(input: ArticleTitleInput): boolean {
    return !(input.metadataTitle ?? '').trim() && !(input.headerTitle ?? '').trim()
}

/**
 * 取 md 文件头 YAML frontmatter 里的 `title`。
 *
 * 与 `renderMarkdown` 的 header.title 同口径（含去引号），这样页面标题、对外清单
 * 和 `npm run check:catalog` 的巡检不会因为解析差异得出不同结论。
 * frontmatter 必须紧贴第一行，否则不认。
 */
export function frontMatterTitle(raw: string): string {
    const lines = raw.split('\n')
    if (!lines[0] || lines[0].trim() !== '---') return ''
    const endIdx = lines.indexOf('---', 1)
    if (endIdx <= 1) return ''
    for (const line of lines.slice(1, endIdx)) {
        const match = line.match(/^title\s*:\s*(.+)$/i)
        if (match) return match[1].trim().replace(/^["']|["']$/g, '').trim()
    }
    return ''
}

/**
 * 侧边栏菜单标题。
 *
 * 菜单栏很窄，塞不下「李煜东《算法竞赛进阶指南》【算阶】题目汇总题单」这种正文标题，
 * 所以菜单名和正文标题分成两轨：
 *
 *     config.yaml menu_title  →  catalog.yaml title
 *
 * `menu_title` 是可选的，没写就沿用 catalog 里的短名——144 篇存量文章今天都写在那里，
 * 不需要迁移。正文标题仍然走 `resolveArticleTitle()`，两者互不影响，也不会再出现
 * 「同一页两个名字」的误会：页面和菜单本来就允许叫得不一样。
 */
export function resolveMenuTitle(input: { menuTitle?: string, catalogTitle?: string }): string {
    for (const candidate of [input.menuTitle, input.catalogTitle]) {
        const value = (candidate ?? '').trim()
        if (value) return value
    }
    return LAST_RESORT
}

/** 菜单标题的显示宽度上限：32 = 16 个汉字。超过就会把侧边栏撑出滚动条。 */
export const MENU_TITLE_MAX_WIDTH = 32

/**
 * 按全角 2、半角 1 估算显示宽度。
 *
 * 只用来给 `check:catalog` 报「menu_title 太长」的提醒，不参与任何渲染。
 */
export function menuTitleWidth(value: string): number {
    let width = 0
    for (const ch of value) width += isWideChar(ch) ? 2 : 1
    return width
}

function isWideChar(ch: string): boolean {
    const code = ch.codePointAt(0) ?? 0
    return (code >= 0x1100 && code <= 0x115f) // 韩文字母
        || (code >= 0x2e80 && code <= 0xa4cf) // CJK 部首、假名、汉字
        || (code >= 0xac00 && code <= 0xd7a3) // 韩文音节
        || (code >= 0xf900 && code <= 0xfaff) // CJK 兼容汉字
        || (code >= 0xfe30 && code <= 0xfe6f) // CJK 兼容形式
        || (code >= 0xff00 && code <= 0xff60) // 全角标点
        || (code >= 0xffe0 && code <= 0xffe6) // 全角符号
        || (code >= 0x1f300 && code <= 0x1faff) // emoji
}
