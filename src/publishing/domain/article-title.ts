/**
 * 文章标题的唯一解析规则。
 *
 * 标题原本有三个来源：`catalog.yaml` 的导航名、`config.yaml` 的 title、md
 * frontmatter 的 title。侧边栏只读第一个、页面读后两个，于是 134 篇文章里有
 * 52 篇在同一个页面上出现两个名字（比如侧边栏「排序不等于式」、正文
 * 「排序不等式」）。现在收敛成一条优先级，三处输出全部用它：
 *
 *     config.yaml title → md frontmatter title → catalog.yaml title
 *
 * - 页面 `<title>` 与正文标题：`resolveArticleTitle()`（templates/article-view.ts）
 * - 侧边栏：`MenuRenderer` 的 `leafTitle`，由 prepare-catalog 传入同一份结果
 * - 对外清单 `dist/catalog.json`：prepare-catalog 阶段就把 title 算进条目
 *
 * `catalog.yaml` 的 title 因此退化为兜底：只有既没有 config 也没有
 * frontmatter 的文章（`book/<章节>/practice.md` 这类叶子）才会用到它，它仍由
 * catalog-loader 保证非空。目录节点没有文章，照旧用清单里的名字。
 *
 * 决定见 docs/adr/0012-single-source-article-titles.md。
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
