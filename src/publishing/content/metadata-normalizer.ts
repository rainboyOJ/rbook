import path from 'path'
import { ArticleMetadata } from '../domain/metadata'
import { Diagnostic } from '../domain/diagnostics'

/**
 * 把 md 的 front matter 归一成文章元数据。
 *
 * 字段分两处：
 * - 顶层：`title`（正文标题，可以长）、`menu_title`（菜单短名，可选）
 * - `rbook:` 子键：其余构建字段（id / pre / copy / practice / code_template /
 *   teach_plan / typst …），原样带进 metadata 供渲染与第三方工具读取
 *
 * 顶层散落的构建字段（旧 config.yaml 的写法被误拷进 md）会报警告并忽略，
 * 避免「同一个字段两处都能写」再次制造漂移。
 */
export function normalizeMetadata(frontMatter: Record<string, unknown>, sourcePath: string, diagnostics: Diagnostic[] = []): ArticleMetadata {
    const rbook = readRbookBlock(frontMatter, sourcePath, diagnostics)
    warnStrayFields(frontMatter, sourcePath, diagnostics)

    const md: ArticleMetadata = {
        ...rbook,
        id: str(rbook.id) || idFromPath(sourcePath),
        title: str(frontMatter.title) || '',
        menuTitle: str(frontMatter.menu_title).trim() || undefined,
        file: path.basename(sourcePath),
    }

    // 旧字段别名映射（历史 config 里出现过）
    if (rbook.hiden_id !== undefined || rbook.hidden_id !== undefined) {
        diagnostics.push({
            phase: 'metadata-normalizer',
            sourcePath,
            level: 'warning',
            message: 'hiden_*/hidden_* 已弃用，请使用 rbook.id',
        })
        md.id = str(rbook.hiden_id ?? rbook.hidden_id) || md.id
    }
    if (rbook.teach_plan !== undefined || rbook.teach_plain !== undefined || rbook.teachPlan !== undefined) {
        const v = rbook.teach_plan ?? rbook.teach_plain ?? rbook.teachPlan
        if (rbook.teach_plain !== undefined || rbook.teachPlan !== undefined) {
            diagnostics.push({
                phase: 'metadata-normalizer',
                sourcePath,
                level: 'warning',
                message: 'teach_plain/teachPlan 已弃用，请使用 rbook.teach_plan',
            })
        }
        md.teachPlan = str(v) || undefined
    }
    if (rbook.copy !== undefined) {
        if (Array.isArray(rbook.copy)) {
            md.copy = rbook.copy.map(String)
        }
        else {
            diagnostics.push({
                phase: 'metadata-normalizer',
                sourcePath,
                level: 'warning',
                message: 'rbook.copy 应为字符串数组',
            })
        }
    }

    return md
}

/** 构建字段只认 `rbook:` 子键；顶层出现就当写错地方，忽略并提示。 */
function readRbookBlock(frontMatter: Record<string, unknown>, sourcePath: string, diagnostics: Diagnostic[]): Record<string, unknown> {
    const raw = frontMatter.rbook
    if (raw === undefined) return {}
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        diagnostics.push({
            phase: 'metadata-normalizer',
            sourcePath,
            level: 'error',
            message: 'front matter 里的 rbook 必须是键值对',
        })
        return {}
    }
    return { ...(raw as Record<string, unknown>) }
}

/** `title` / `menu_title` 之外，顶层不应出现构建字段。 */
const STRAY_TOP_LEVEL = [
    'id', 'pre', 'copy', 'practice', 'code_template', 'teach_plan', 'teach_plain', 'teachPlan', 'file',
    'hiden_id', 'hidden_id', 'hiden_title', 'hidden_title',
]

function warnStrayFields(frontMatter: Record<string, unknown>, sourcePath: string, diagnostics: Diagnostic[]): void {
    const stray = STRAY_TOP_LEVEL.filter(key => frontMatter[key] !== undefined)
    if (stray.length === 0) return
    diagnostics.push({
        phase: 'metadata-normalizer',
        sourcePath,
        level: 'warning',
        message: `构建字段应写在 front matter 的 rbook: 子键里，已忽略顶层 ${stray.join(', ')}`,
        suggestion: `把 ${stray.join(', ')} 缩进到 rbook: 下`,
    })
}

function str(v: unknown): string {
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(v)
    return ''
}

function idFromPath(sourcePath: string): string {
    const noExt = sourcePath.replace(/\.md$/i, '')
    const parts = noExt.split(/[\\/]/).filter(Boolean)
    const base = parts[parts.length - 1] || 'untitled'
    // 目录文章入口通常叫 index.md，此时用目录名作为 id；
    // 否则（如 practice.md / preface.md）用文件名。
    if (base === 'index' && parts.length >= 2) {
        return parts[parts.length - 2]
    }
    return base
}
