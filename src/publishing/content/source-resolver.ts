import fs from 'fs'
import path from 'path'
import { ArticleSource } from '../domain/article'
import { loadConfig } from './config-loader'
import { normalizeMetadata } from './metadata-normalizer'
import { ArticleMetadata } from '../domain/metadata'
import { Diagnostic } from '../domain/diagnostics'

export interface ResolvedArticle {
    source: ArticleSource
    metadata: ArticleMetadata
    configDir: string
    hasConfig: boolean
}

export function resolveArticleSource(entryPath: string, bookDir: string, diagnostics: Diagnostic[] = []): ResolvedArticle {
    const abs = path.isAbsolute(entryPath) ? entryPath : path.join(bookDir, entryPath)
    const normalized = path.normalize(abs)

    if (!fs.existsSync(normalized)) {
        diagnostics.push({
            phase: 'source-resolver',
            level: 'error',
            message: `文章源不存在: ${entryPath}`,
        })
        throw new Error(`文章源不存在: ${entryPath}`)
    }

    let filePath: string
    let configDir: string
    let hasConfig = false
    let rawConfig: Record<string, unknown> | null = null

    const stat = fs.statSync(normalized)
    if (stat.isDirectory()) {
        const config = loadConfig(normalized, diagnostics)
        if (!config) {
            // 目录但没有 config，默认使用 index.md
            configDir = normalized
            filePath = path.join(normalized, 'index.md')
        }
        else {
            hasConfig = true
            configDir = normalized
            rawConfig = config.data
            const file = str(config.data.file) || 'index.md'
            filePath = path.join(normalized, file)
        }
    }
    else if (normalized.endsWith('.md')) {
        configDir = path.dirname(normalized)
        filePath = normalized
        const config = loadConfig(configDir, diagnostics)
        if (config) {
            hasConfig = true
            rawConfig = config.data
        }
    }
    else {
        diagnostics.push({
            phase: 'source-resolver',
            level: 'error',
            message: `非法路径 (非目录且非 .md): ${entryPath}`,
        })
        throw new Error(`非法路径: ${entryPath}`)
    }

    if (!fs.existsSync(filePath)) {
        diagnostics.push({
            phase: 'source-resolver',
            level: 'error',
            message: `文章文件不存在: ${filePath}`,
        })
        throw new Error(`文章文件不存在: ${filePath}`)
    }

    const metadata = normalizeMetadata(rawConfig ?? {}, filePath, diagnostics)
    const source: ArticleSource = {
        filePath,
        raw: fs.readFileSync(filePath, 'utf8'),
        dir: path.dirname(filePath),
    }

    return { source, metadata, configDir, hasConfig }
}

function str(v: unknown): string {
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    return ''
}