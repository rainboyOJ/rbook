import fs from 'fs'
import path from 'path'
import { ArticleSource } from '../domain/article'
import { normalizeMetadata } from './metadata-normalizer'
import { readFrontMatter } from './front-matter'
import { ArticleMetadata } from '../domain/metadata'
import { Diagnostic } from '../domain/diagnostics'

export interface ResolvedArticle {
    source: ArticleSource
    metadata: ArticleMetadata
    /** md 里解析出来的 front matter 原样对象（构建字段在 `rbook:` 子键） */
    frontMatter: Record<string, unknown>
}

/**
 * 把 catalog 里的一条叶子解析成「文件 + 元数据」。
 *
 * 目录叶子默认读 `index.md`，.md 叶子读文件本身；两者的元数据都来自该 md 的
 * front matter，不再有目录级的 `config.yaml`——一份配置只描述一个文件，
 * 因此「同目录 config 作用到兄弟文件」这类错配从结构上消失
 * （见 docs/adr/0013-metadata-in-front-matter.md）。
 */
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

    const stat = fs.statSync(normalized)
    let filePath: string
    if (stat.isDirectory()) {
        filePath = path.join(normalized, 'index.md')
    }
    else if (normalized.endsWith('.md')) {
        filePath = normalized
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
            suggestion: '目录叶子需要一个 index.md，或把 catalog 的 path 直接指向 .md 文件',
        })
        throw new Error(`文章文件不存在: ${filePath}`)
    }

    const raw = fs.readFileSync(filePath, 'utf8')
    const frontMatter = readFrontMatter(raw, filePath, diagnostics)
    const metadata = normalizeMetadata(frontMatter.data, filePath, diagnostics)
    const source: ArticleSource = {
        filePath,
        raw,
        dir: path.dirname(filePath),
    }

    return { source, metadata, frontMatter: frontMatter.data }
}
