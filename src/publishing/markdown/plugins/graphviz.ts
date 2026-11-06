import { spawnSync } from 'node:child_process'
import type { Diagnostic } from '../../domain/diagnostics'

export interface GraphvizOptions {
    idPrefix: string
    sourcePath?: string
    line?: number
    diagnostics?: Diagnostic[]
    /** 默认为 PATH 中的 dot；可指定完整路径以适配构建环境。 */
    command?: string
}

/** 构建期生成 SVG；失败直接抛错，让发布管线阻断坏页。 */
export function renderGraphvizSvg(source: string, opts: GraphvizOptions): string {
    const fail = (message: string): never => {
        const location = opts.sourcePath ? `${opts.sourcePath}${opts.line ? `:${opts.line}` : ''}: ` : ''
        opts.diagnostics?.push({
            phase: 'graphviz', level: 'error', sourcePath: opts.sourcePath, line: opts.line, message,
        })
        throw new Error(`${location}Graphviz 渲染失败: ${message}`)
    }

    // DOT 经 stdin 传入，命令和参数独立传递，不经过 shell。
    const result = spawnSync(opts.command || 'dot', [
        '-Tsvg',
        '-Gfontname=Noto Serif SC',
        '-Nfontname=Noto Serif SC',
        '-Efontname=Noto Serif SC',
    ], {
        input: source,
        encoding: 'utf8',
        timeout: 10000,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
    })

    if (result.error) {
        const code = 'code' in result.error ? result.error.code : undefined
        if (code === 'ENOENT') fail('未找到 Graphviz 的 dot 命令，请安装 Graphviz 并确认其位于 PATH 中。')
        if (code === 'ETIMEDOUT') fail('生成图形超过 10 秒，请检查图的规模或布局约束。')
        fail(result.error.message)
    }
    const detail = (result.stderr || '').trim().slice(0, 4000)
    if (result.status !== 0) fail(detail || `dot 异常退出 (${result.status ?? result.signal})`)

    const output = result.stdout || ''
    if ((output.match(/<svg\b/g) || []).length !== 1 || !output.includes('</svg>')) {
        fail('每个代码块应生成一张有效的 SVG，请检查 DOT 内容。')
    }
    if (detail) opts.diagnostics?.push({
        phase: 'graphviz', level: 'warning', sourcePath: opts.sourcePath, line: opts.line, message: detail,
    })

    // 去除 XML 声明和 DOCTYPE；为每幅内联 SVG 的 ID 及其引用添加独立前缀。
    let svg = output.slice(output.indexOf('<svg')).trim()
    const ids = new Map<string, string>()
    svg = svg.replace(/\bid="([^"]+)"/g, (_match, id: string) => {
        const unique = opts.idPrefix + id
        ids.set(id, unique)
        return `id="${unique}"`
    })
    svg = svg.replace(/\b((?:xlink:)?href)="#([^"]+)"/g,
        (_match, attr: string, id: string) => `${attr}="#${ids.get(id) || id}"`)
    svg = svg.replace(/url\(#([^)]*)\)/g,
        (_match, id: string) => `url(#${ids.get(id) || id})`)
    return svg.replace('<svg ', '<svg role="img" aria-label="Graphviz 图形" ')
}
