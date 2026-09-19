import path from 'path'

export interface CatalogEntry {
    title: string
    path?: string
    children?: CatalogEntry[]
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