/**
 * 文章标题的唯一解析规则。
 *
 * 同一篇文章的标题会在三个地方出现，三者必须用同一套优先级，否则页面、
 * 侧边栏和对外清单会给出不同的名字：
 *
 * - 页面标题：`metadata.title || header.title || catalogTitle`
 * - 对外清单 `catalog.json`：`metadata.title || catalogTitle`（清单阶段不渲染 markdown，
 *   拿不到 header.title）
 * - 侧边栏：直接用 `catalogTitle`（导航短名，本来就可能与文章标题不同）
 *
 * 注意 `header.title` 不是 md 的第一个 H1，而是 renderMarkdown 从 md 的 YAML
 * frontmatter 里读出来的 `title:`（见 markdown/create-markdown-renderer.ts）。
 *
 * 背景：`config.yaml` 是可选的，`book/<章节>/practice.md` 这类叶子可能既没有 config
 * 也没有 frontmatter，于是 `metadata.title` 与 `header.title` 都为空。以前这里会落成
 * 「未知」，现在优先用 `catalog.yaml` 的 title 兜底——它由 catalog-loader 保证非空。
 */
export interface ArticleTitleInput {
    /** 文章目录 config.yaml 里的 title */
    metadataTitle?: string
    /** md frontmatter 里的 title（renderMarkdown 的 header.title） */
    headerTitle?: string
    /** catalog.yaml 里的导航标题 */
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
 * `catalogTitle` 存在时说明标题是导航名冒充的，内容作者应当补一个真标题；
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
