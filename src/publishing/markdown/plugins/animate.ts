import fs from 'fs'
import path from 'path'
import MarkdownIt from 'markdown-it'
import type { Diagnostic } from '../../domain/diagnostics'

export interface AnimateOptions {
    /** 动画源码允许所在的根目录，默认是 <projectRoot>/book。 */
    root: string
    projectRoot?: string
    diagnostics?: Diagnostic[]
}

const ANIMATE_RE = /\[\[\[\s*animate\s*:\s*([^\]]+?)\s*\]\]\]/g

export function animationModuleUrl(sourcePath: string, root: string): string {
    const relative = path.relative(path.resolve(root), sourcePath)
        .replace(/[\\/]+/g, '/')
        .replace(/\.animation\.ts$/i, '.js')
    return `/animations/${relative}`
}

/**
 * 在 Markdown 仍保有来源文件信息时解析动画引用。
 * include 插件也调用它，因此被包含片段中的相对路径不会误用外层文章目录。
 */
export function renderAnimateDirectives(
    source: string,
    fromFile: string | undefined,
    opts: AnimateOptions,
): string {
    if (!source.includes('animate')) return source

    return source.replace(ANIMATE_RE, (_whole, rawTarget: string) => {
        const target = unquote(rawTarget.trim())
        const resolved = resolveAnimationSource(target, fromFile, opts)
        if (!resolved) return renderFailure(target)

        const moduleUrl = animationModuleUrl(resolved, opts.root)
        return [
            `<div class="rbook-animation" data-animation-module="${escapeAttribute(moduleUrl)}">`,
            '  <p class="rbook-animation__loading" role="status">交互动画加载中...</p>',
            '</div>',
        ].join('\n')
    })
}

export function resolveAnimationSource(
    target: string,
    fromFile: string | undefined,
    opts: AnimateOptions,
): string | null {
    const root = path.resolve(opts.root)
    if (!fromFile && !path.isAbsolute(target)) {
        report(opts, fromFile, target, '相对路径缺少当前 Markdown 文件位置')
        return null
    }

    const projectRoot = path.resolve(opts.projectRoot || path.dirname(root))
    const resolved = path.normalize(path.isAbsolute(target)
        ? path.resolve(projectRoot, target.replace(/^[/\\]+/, ''))
        : path.resolve(path.dirname(fromFile as string), target))

    if (resolved !== root && !resolved.startsWith(root + path.sep)) {
        report(opts, fromFile, target, `路径越界，只允许引用 ${root} 内的动画`)
        return null
    }
    if (!/\.animation\.ts$/i.test(resolved)) {
        report(opts, fromFile, target, '动画入口必须以 .animation.ts 结尾')
        return null
    }
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        report(opts, fromFile, target, '动画入口文件不存在')
        return null
    }
    return resolved
}

function report(opts: AnimateOptions, sourcePath: string | undefined, target: string, reason: string): void {
    opts.diagnostics?.push({
        phase: 'animate',
        level: 'error',
        sourcePath,
        message: `动画引用失败: ${target} (${reason})`,
    })
}

function renderFailure(target: string): string {
    return `<div class="rbook-animation rbook-animation--error" role="alert">动画加载失败: ${escapeHtml(target)}</div>`
}

function unquote(value: string): string {
    return value.replace(/^["']|["']$/g, '')
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function escapeAttribute(value: string): string {
    return escapeHtml(value).replace(/"/g, '&quot;')
}

export default function animatePlugin(md: MarkdownIt, opts: AnimateOptions): void {
    md.core.ruler.before('normalize', 'rbook_animate', function animate(state) {
        const env = (state.env || {}) as Record<string, unknown>
        const fromFile = env.currentMdFilePath as string | undefined
        state.src = renderAnimateDirectives(state.src, fromFile, opts)
        return true
    })
}
