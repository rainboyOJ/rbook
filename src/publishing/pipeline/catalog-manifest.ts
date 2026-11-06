import fs from 'fs'
import path from 'path'
import { mkdirp } from 'mkdirp'
import { Diagnostic } from '../domain/diagnostics'
import { ArticleIndexEntry } from '../domain/metadata'

/**
 * 对外发布的文章清单 `dist/catalog.json`。
 *
 * 本站是纯静态站点，没有 REST 接口。但 rbook_new_problem_solutions 需要把题解
 * frontmatter 里的 `rbook1:<id>` 解析成文章标题和链接，所以构建期把
 * id -> { title, url } 落成一个 JSON，nginx 当静态文件托管即可。
 *
 * 站点短名与题解 frontmatter 的前缀一一对应：
 *   rbook1 -> 本站 newRbook_ejs   (https://rbook.roj.ac.cn)
 *   rbook2 -> rbook_nunjucks      (https://rbook2.roj.ac.cn)
 * 两本书存在同名 id（实测 29 个，其中 4 个指向不同文章），所以清单里的 id
 * 保持裸值，前缀由使用方按 site 拼上。
 */
export const SITE_ID = 'rbook1'

export interface CatalogManifestItem {
    id: string
    title: string
    /** 站内根相对路径，例如 /base/presum/index.html */
    url: string
}

export interface CatalogManifest {
    site: string
    /** ISO 时间戳。静态文件没有健康检查，靠它判断产物是否过期。 */
    generatedAt: string
    total: number
    items: CatalogManifestItem[]
}

export interface BuildCatalogManifestOptions {
    site?: string
    generatedAt?: string
    diagnostics?: Diagnostic[]
}

/**
 * 把文章索引转成对外清单。
 *
 * 只有能从 catalog.yaml 解析出真实 URL 的条目才会进入清单：条目在清单里等于
 * 「这个 id 可以对外链接」，收进来却打不开是更坏的错误。id 留空、URL 不是站内
 * 根相对路径、或 id 重复都会记 error，由调用方决定让构建失败。
 */
export function buildCatalogManifest(
    entries: ArticleIndexEntry[],
    opts: BuildCatalogManifestOptions = {},
): CatalogManifest {
    const diagnostics = opts.diagnostics || []
    const items: CatalogManifestItem[] = []
    const seen = new Map<string, string>()

    for (const entry of entries) {
        const id = String(entry.id || '').trim()
        const url = String(entry.publishHref || '').trim()

        if (!id) {
            diagnostics.push({
                phase: 'emit-catalog-manifest',
                sourcePath: entry.sourcePath,
                level: 'error',
                message: '文章缺少 id，无法进入 catalog.json',
                suggestion: '在该文章目录的 config.yaml 里写 id',
            })
            continue
        }

        // 使用方（rbook_new_problem_solutions 的 toArticleMap）只接受根相对路径，
        // 以 // 开头会被当成协议相对 URL，必须挡掉。
        if (!url.startsWith('/') || url.startsWith('//')) {
            diagnostics.push({
                phase: 'emit-catalog-manifest',
                articleId: id,
                sourcePath: entry.sourcePath,
                level: 'error',
                message: `文章 URL 必须是站内根相对路径，实际为 "${url}"`,
            })
            continue
        }

        const title = String(entry.title || '').trim()
        if (!title) {
            diagnostics.push({
                phase: 'emit-catalog-manifest',
                articleId: id,
                sourcePath: entry.sourcePath,
                level: 'error',
                message: `文章缺少标题，catalog.json 里会出现没有文字可点的链接`,
                suggestion: '在该文章目录的 config.yaml 写 title，或给 md 加一个 H1',
            })
            continue
        }

        const previous = seen.get(id)
        if (previous !== undefined) {
            diagnostics.push({
                phase: 'emit-catalog-manifest',
                articleId: id,
                sourcePath: entry.sourcePath,
                level: 'error',
                message: `重复的文章 id "${id}"：${previous} 与 ${url}`,
                suggestion: 'id 会覆盖写入清单，必须唯一；改掉其中一个 config 里的 id',
            })
            continue
        }

        seen.set(id, url)
        items.push({ id, title, url })
    }

    return {
        site: opts.site || SITE_ID,
        generatedAt: opts.generatedAt || new Date().toISOString(),
        total: items.length,
        items,
    }
}

export function writeCatalogManifest(distDir: string, manifest: CatalogManifest): string {
    const target = path.join(distDir, 'catalog.json')
    mkdirp.sync(distDir)
    fs.writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    return target
}
