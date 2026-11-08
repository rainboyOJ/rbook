import yaml from 'js-yaml'
import { Diagnostic } from '../domain/diagnostics'

/**
 * md 文件头部的 YAML front matter。
 *
 * 文章的构建元数据（id / pre / code_template / copy / practice / teach_plan）
 * 从 2026-11 起写在 front matter 的 `rbook:` 子键里，`config.yaml` 已经下线：
 * 一个目录一份 config 意味着「扁平 .md 文章不能有元数据」，也让「目录 config
 * 作用到兄弟文件」成了长期 bug 来源（见 docs/adr/0013-metadata-in-front-matter.md）。
 *
 * 只认紧贴第一行的 `---`（允许 BOM），与旧 frontMatterTitle 的判定一致。
 */
export interface FrontMatter {
    /** 解析出来的 YAML 对象；没有 front matter 时是空对象 */
    data: Record<string, unknown>
    /** front matter 之后的正文 */
    body: string
    /** 是否存在完整的 front matter 块 */
    present: boolean
}

export function readFrontMatter(raw: string, sourcePath = '', diagnostics: Diagnostic[] = []): FrontMatter {
    const text = raw.replace(/^\uFEFF/, '')
    const lines = text.split('\n')
    const bodyFrom = (from: number): string => lines.slice(from).join('\n')

    if (lines.length === 0 || lines[0].trim() !== '---') {
        return { data: {}, body: text, present: false }
    }

    let end = -1
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
            end = i
            break
        }
    }
    if (end < 0) {
        diagnostics.push({
            phase: 'front-matter',
            sourcePath,
            level: 'warning',
            message: 'front matter 缺少收尾的 ---，整篇按正文处理',
            suggestion: '在元数据后补一行 ---',
        })
        return { data: {}, body: text, present: false }
    }

    let parsed: unknown
    try {
        parsed = yaml.load(lines.slice(1, end).join('\n'))
    }
    catch (err) {
        diagnostics.push({
            phase: 'front-matter',
            sourcePath,
            level: 'error',
            message: `front matter YAML 解析失败: ${err instanceof Error ? err.message : String(err)}`,
        })
        return { data: {}, body: bodyFrom(end + 1), present: true }
    }

    if (parsed === null || parsed === undefined) {
        return { data: {}, body: bodyFrom(end + 1), present: true }
    }
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        diagnostics.push({
            phase: 'front-matter',
            sourcePath,
            level: 'error',
            message: 'front matter 必须是键值对（YAML 映射）',
        })
        return { data: {}, body: bodyFrom(end + 1), present: true }
    }

    return { data: parsed as Record<string, unknown>, body: bodyFrom(end + 1), present: true }
}
