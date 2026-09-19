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

    constructor(opts: MenuRendererOptions) {
        this.templatePath = path.join(opts.templateDir, 'li_item.html')
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
        return this.compiled({ ...entry, ul, link: childPath })
    }
}

/** 便捷函数：读取清单文件并渲染侧边栏 HTML。 */
export function renderMenuHtml(catalogPath: string, opts: MenuRendererOptions): string {
    const catalog = loadCatalog(catalogPath)
    return new MenuRenderer(opts).render(catalog)
}
