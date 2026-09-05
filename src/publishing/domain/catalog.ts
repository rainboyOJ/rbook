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
            const fullPath = parentPath ? `${parentPath}/${entry.path}` : entry.path || ''
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