import { ArticleMetadata } from '../domain/metadata'
import { Diagnostic } from '../domain/diagnostics'

interface RawConfig {
    id?: unknown
    title?: unknown
    file?: unknown
    copy?: unknown
    teach_plan?: unknown
    teach_plain?: unknown
    teachPlan?: unknown
    hiden_id?: unknown
    hidden_id?: unknown
    hiden_title?: unknown
    hidden_title?: unknown
    [key: string]: unknown
}

export function normalizeMetadata(raw: RawConfig, sourcePath: string, diagnostics: Diagnostic[] = []): ArticleMetadata {
    const md: ArticleMetadata = {
        id: str(raw.id) || idFromPath(sourcePath),
        title: str(raw.title) || '',
        file: str(raw.file) || 'index.md',
    }

    // 旧字段别名映射
    if (raw.hiden_id !== undefined || raw.hidden_id !== undefined) {
        const v = raw.hiden_id ?? raw.hidden_id
        diagnostics.push({
            phase: 'metadata-normalizer',
            sourcePath,
            level: 'warning',
            message: `hiden_*/hidden_* 已弃用，请使用标准字段`,
        })
        md.id = str(v) || md.id
    }
    if (raw.hiden_title !== undefined || raw.hidden_title !== undefined) {
        diagnostics.push({
            phase: 'metadata-normalizer',
            sourcePath,
            level: 'warning',
            message: `hiden_title/hidden_title 已弃用，请使用 title`,
        })
        md.title = str(raw.hiden_title ?? raw.hidden_title) || md.title
    }
    if (raw.teach_plan !== undefined || raw.teach_plain !== undefined || raw.teachPlan !== undefined) {
        const v = raw.teach_plan ?? raw.teach_plain ?? raw.teachPlan
        if (raw.teach_plain !== undefined || raw.teachPlan !== undefined) {
            diagnostics.push({
                phase: 'metadata-normalizer',
                sourcePath,
                level: 'warning',
                message: `teach_plain/teachPlan 已弃用，请使用 teach_plan`,
            })
        }
        md.teachPlan = str(v) || undefined
    }
    if (raw.copy !== undefined) {
        if (Array.isArray(raw.copy)) {
            md.copy = raw.copy.map(String)
        }
        else {
            diagnostics.push({
                phase: 'metadata-normalizer',
                sourcePath,
                level: 'warning',
                message: `copy 字段应为字符串数组`,
            })
        }
    }

    return md
}

function str(v: unknown): string {
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    return ''
}

function idFromPath(sourcePath: string): string {
    const dir = sourcePath.replace(/\.md$/i, '')
    const parts = dir.split(/[\\/]/).filter(Boolean)
    return parts[parts.length - 1] || 'untitled'
}