import path from 'path'

export interface CatalogEntry {
    title: string
    path?: string
    children?: CatalogEntry[]
    /** 标记站点首页文章（只能有一个，且必须是叶子条目） */
    home?: boolean
    /**
     * 渲染、可链接，但不出现在侧边栏。
     *
     * 用于「有文章、有 id，但暂不进导航」的内容：题目类文章、半成品、
     * 只给特定文章正文引用的补充阅读。它与「不在 catalog 里」完全不同：
     * 后者不会被构建，写在正文里就是死链。
     */
    hidden?: boolean
}

export interface Catalog {
    entries: CatalogEntry[]
    source: string
}

export function flattenCatalog(catalog: Catalog): string[] {
    const result: string[] = []
    function walk(entries: CatalogEntry[], parentPath: string) {
        for (const entry of entries) {
            const fullPath = joinCatalogPath(parentPath, entry.path)
            if (entry.children) {
                walk(entry.children, fullPath)
            } else {
                result.push(fullPath)
            }
        }
    }
    walk(catalog.entries, '')
    return result
}

export interface FlatCatalogLeaf {
    /** book 相对路径，与 flattenCatalog() 的输出逐项对应 */
    path: string
    /** catalog.yaml 里写的标题，是侧边栏与对外清单的权威标题 */
    title: string
    /** 自己或任一祖先标了 hidden：会渲染，但不进侧边栏 */
    hidden: boolean
}

/**
 * 与 flattenCatalog() 同一套遍历，但同时带回清单标题。
 *
 * 文章叶子可以没有 config（例如直接放在 book/<章节目录>/practice.md），此时
 * metadata.title 为空，而 catalog.yaml 的 title 一定有。对外清单要用它兜底，
 * 否则清单里会出现没有文字可点的链接。
 */
export function flattenCatalogLeaves(catalog: Catalog): FlatCatalogLeaf[] {
    const result: FlatCatalogLeaf[] = []
    function walk(entries: CatalogEntry[], parentPath: string, hidden: boolean) {
        for (const entry of entries) {
            const fullPath = joinCatalogPath(parentPath, entry.path)
            const entryHidden = hidden || entry.hidden === true
            if (entry.children) {
                walk(entry.children, fullPath, entryHidden)
            }
            else {
                result.push({ path: fullPath, title: entry.title, hidden: entryHidden })
            }
        }
    }
    walk(catalog.entries, '', false)
    return result
}

/**
 * 找出被标记为站点首页的叶子文章路径（book 相对路径）。
 * 返回 null 表示清单里没有 `home: true`。
 */
export function findHomeLeaf(catalog: Catalog): string | null {
    let home: string | null = null
    function walk(entries: CatalogEntry[], parentPath: string) {
        for (const entry of entries) {
            const fullPath = joinCatalogPath(parentPath, entry.path)
            if (entry.home === true) home = fullPath
            if (entry.children) walk(entry.children, fullPath)
        }
    }
    walk(catalog.entries, '')
    return home
}

/** 同上，但返回命中的条目本身（用于诊断定位）。 */
export function findHomeEntry(catalog: Catalog): CatalogEntry | null {
    function walk(entries: CatalogEntry[]): CatalogEntry | null {
        for (const entry of entries) {
            if (entry.home === true) return entry
            if (entry.children) {
                const found = walk(entry.children)
                if (found) return found
            }
        }
        return null
    }
    return walk(catalog.entries)
}

/**
 * 把父级路径与清单条目路径拼成规范化的 book 相对路径。
 *
 * 清单里允许出现尾斜杠（例如 `enumeration_permutaion_combination/`），
 * 直接做字符串拼接会产生 `a//b` 这样的双斜杠。这里用 posix 语义拼接，
 * 既消除重复斜杠，又保留原有的尾斜杠形式（`introducation/`）。
 */
export function joinCatalogPath(parentPath: string, entryPath?: string): string {
    const seg = entryPath ?? ''
    if (!seg) return parentPath
    return path.posix.join(parentPath, seg)
}