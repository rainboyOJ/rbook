import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { Catalog, CatalogEntry } from '../domain/catalog'
import { Diagnostic } from '../domain/diagnostics'

const KNOWN_KEYS = new Set(['title', 'path', 'children'])

export function loadCatalog(catalogPath: string, diagnostics: Diagnostic[] = []): Catalog {
    if (!fs.existsSync(catalogPath)) {
        diagnostics.push({
            phase: 'prepare-catalog',
            level: 'error',
            message: `catalog 文件不存在: ${catalogPath}`,
        })
        throw new Error(`catalog 文件不存在: ${catalogPath}`)
    }

    let raw: unknown
    try {
        raw = yaml.load(fs.readFileSync(catalogPath, 'utf8'))
    }
    catch (err) {
        diagnostics.push({
            phase: 'prepare-catalog',
            level: 'error',
            message: `catalog YAML 解析失败: ${err instanceof Error ? err.message : String(err)}`,
        })
        throw err
    }

    if (!Array.isArray(raw)) {
        throw new Error('catalog.yaml 顶层必须是条目数组')
    }

    validateEntries(raw as unknown as CatalogEntry[], '', diagnostics)
    return { entries: raw as unknown as CatalogEntry[], source: catalogPath }
}

function validateEntries(entries: CatalogEntry[], parentPath: string, diagnostics: Diagnostic[]): void {
    const seen = new Map<string, string>()
    for (const entry of entries) {
        if (typeof entry !== 'object' || entry === null) {
            diagnostics.push({
                phase: 'prepare-catalog',
                level: 'error',
                message: `非法条目: ${JSON.stringify(entry)}`,
            })
            continue
        }
        if (!entry.title) {
            diagnostics.push({
                phase: 'prepare-catalog',
                level: 'error',
                message: `条目缺少 title (path=${entry.path ?? '<none>'})`,
            })
        }
        for (const key of Object.keys(entry)) {
            if (!KNOWN_KEYS.has(key)) {
                diagnostics.push({
                    phase: 'prepare-catalog',
                    level: 'warning',
                    message: `未知字段: ${key}`,
                })
            }
        }
        const fullPath = parentPath
            ? path.join(parentPath, entry.path ?? '')
            : entry.path ?? ''
        if (entry.path && seen.has(entry.path)) {
            diagnostics.push({
                phase: 'prepare-catalog',
                level: 'error',
                message: `重复导航 id: ${entry.path} (先见于 "${seen.get(entry.path)}")`,
            })
        }
        if (entry.path) seen.set(entry.path, entry.title)
        if (entry.children) {
            validateEntries(entry.children, fullPath, diagnostics)
        }
    }
}