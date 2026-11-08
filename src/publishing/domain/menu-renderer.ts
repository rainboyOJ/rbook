import ejs from 'ejs'
import fs from 'fs'
import path from 'path'
import { Catalog, CatalogEntry, joinCatalogPath } from './catalog'
import { loadCatalog } from '../content/catalog-loader'

export interface MenuRendererOptions {
    /** li_item.html 所在目录，通常是 <projectRoot>/src/ejs */
    templateDir: string
    /** EJS include 的 root，通常是 <projectRoot>/src */
    root?: string
    /** 叶子 catalog 路径对应的发布 URL。 */
    leafHref?: (catalogPath: string) => string
    /**
     * 叶子的附加信息：菜单短名、文章 id、正文标题。
     *
     * 菜单名走 `config.menu_title` → `catalog.yaml title` 两轨（见
     * docs/adr/0012-dual-track-article-titles.md）：菜单栏窄，正文标题可能很长。
     * id 与正文标题只写进 `data-*`，供侧边栏搜索匹配，不显示。
     */
    leafMeta?: (catalogPath: string) => LeafMeta | undefined
}

/** 侧边栏搜索要用的叶子信息；不显示，只挂在 DOM 上。 */
export interface LeafMeta {
    /** config.menu_title，空则回退到 catalog 里的 title */
    menuTitle?: string
    /** 文章 id，写进 data-article-id，像 topsort 这种英文缩写靠它搜到 */
    articleId?: string
    /** 正文标题（config.title 解析结果），写进 data-article-title */
    articleTitle?: string
}

/**
 * 把目录清单渲染成侧边栏 HTML。
 *
 * 这是 `src/menu.js` 中 `menu_to_ul_list` 的等价实现，但数据源换成
 * `book/catalog.yaml`，使目录成为侧边栏与文章渲染清单的唯一真相
 * （见 docs/adr/0002-separate-catalog-from-article-metadata.md）。
 */
export class MenuRenderer {
    private readonly templatePath: string
    private readonly compiled: ejs.TemplateFunction
    private readonly leafHref?: (catalogPath: string) => string
    private readonly leafMeta?: (catalogPath: string) => LeafMeta | undefined

    constructor(opts: MenuRendererOptions) {
        this.templatePath = path.join(opts.templateDir, 'li_item.html')
        this.leafHref = opts.leafHref
        this.leafMeta = opts.leafMeta
        if (!fs.existsSync(this.templatePath)) {
            throw new Error(`侧边栏模板不存在: ${this.templatePath}`)
        }
        const raw = fs.readFileSync(this.templatePath, 'utf8')
        this.compiled = ejs.compile(raw, {
            filename: this.templatePath,
            root: opts.root || path.resolve(opts.templateDir, '..'),
        })
    }

    render(catalog: Catalog): string {
        return this.renderEntries('/', catalog.entries)
    }

    private renderEntries(parentPath: string, entries: CatalogEntry[]): string {
        let html = '<ul>\n'
        for (const entry of entries) {
            // hidden 的条目和它整棵子树都不进侧边栏；它们仍然会被构建和发布。
            if (entry.hidden === true) continue
            html += this.renderEntry(parentPath, entry)
        }
        html += '</ul>\n'
        return html
    }

    private renderEntry(parentPath: string, entry: CatalogEntry): string {
        const childPath = '/' + joinCatalogPath(parentPath.replace(/^\//, ''), entry.path)
        let ul = ''
        if (entry.children && entry.children.length > 0) {
            ul = this.renderEntries(childPath, entry.children)
        }
        const isLeaf = ul.length === 0
        const link = isLeaf
            ? (this.leafHref?.(childPath.slice(1)) ?? defaultLeafHref(childPath))
            : ''
        // 叶子可以用 config.menu_title 覆盖清单名；目录节点没有文章，仍用清单里的名字。
        const meta = isLeaf ? this.leafMeta?.(childPath.slice(1)) : undefined
        const menuTitle = (meta?.menuTitle ?? '').trim()
        const title = menuTitle || entry.title
        return this.compiled({
            ...entry,
            title,
            ul,
            link,
            directoryPath: childPath,
            articleId: meta?.articleId ?? '',
            articleTitle: meta?.articleTitle ?? '',
        })
    }
}

function defaultLeafHref(catalogPath: string): string {
    const normalized = catalogPath.replace(/^\//, '').replace(/\/$/, '')
    return normalized.endsWith('.md')
        ? `/${normalized.replace(/\.md$/i, '.html')}`
        : `/${normalized}/index.html`
}

/** 便捷函数：读取清单文件并渲染侧边栏 HTML。 */
export function renderMenuHtml(catalogPath: string, opts: MenuRendererOptions): string {
    const catalog = loadCatalog(catalogPath)
    return new MenuRenderer(opts).render(catalog)
}
