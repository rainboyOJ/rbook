import fs from 'fs'
import path from 'path'
import MarkdownIt from 'markdown-it'
import type { Diagnostic } from '../../domain/diagnostics'

/**
 * `[[[dsa: <slug>]]]` —— 外链到两个动画站（anima1 / dsa3）的演示卡片。
 *
 * 与 animate 插件的分工：
 *   - `[[[animate: ./x.animation.ts]]]` 内嵌**本书打包**的交互模块；
 *   - `[[[dsa: quickSort]]]` 生成一张卡片，**跳转**到外部动画站。
 * 两者语义不同，因此不共用指令名。
 *
 * slug -> 标题/图标/站点 的映射来自 `book/demos.json`（由
 * `scripts/sync-demos.mjs` 抓取生成）。未知 slug 报 diagnostics error，
 * 与 animate 插件路径越界时的策略一致，避免把死链发布出去。
 */

export interface DsaOptions {
    /** book/demos.json 的路径。缺失时插件不注册。 */
    manifestPath: string
    diagnostics?: Diagnostic[]
}

interface DemoSite {
    baseUrl: string
    label: string
    title: string
}

interface DemoEntry {
    site: string
    path: string
    title: string
    icon?: string | null
    /** dsa3 的图标 SVG body，由 sync-demos.mjs 从注册表抓取写入。 */
    iconSvg?: string
    description?: string
    tags?: string[]
    accent?: string
}

interface DemoManifest {
    sites: Record<string, DemoSite>
    demos: Record<string, DemoEntry>
}

const DSA_RE = /\[\[\[\s*dsa\s*:\s*([^\]]+?)\s*\]\]\]/g

/**
 * 插件跑在 normalize 之前，此时代码块还没被 tokenize，
 * 若直接对整篇源码做替换，围栏里的 `[[[dsa: ...]]]` 也会被展开，
 * 导致无法在正文中书写这个语法的用法示例。
 * 先把围栏块与行内代码整段摘出来，替换完再放回去。
 *
 * 围栏必须是**一整段**匹配（开头行到闭合行），否则会和引用块里的反引号
 * 拆成两个片段，围栏内部就漏到替换范围里了。
 */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm
// 未闭合的围栏：markdown-it 会把直到文末都当成代码块，这里同样整段保护。
const OPEN_FENCE_RE = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n[\s\S]*)?$/m
const INLINE_CODE_RE = /(`+)(?:(?!\1)[\s\S])*?\1/g

function protectCodeSegments(source: string): { text: string, restore: (rendered: string) => string } {
    const segments: string[] = []
    const stash = (whole: string) => {
        // 占位符带 \u0000，正文里不可能出现，避免与真实内容碰撞。
        const token = `\u0000DSA_CODE_${segments.length}\u0000`
        segments.push(whole)
        return token
    }
    // 先抽围栏（含未闭合的），再在剩下的文本里抽行内代码。
    const withoutFences = source.replace(FENCE_RE, stash).replace(OPEN_FENCE_RE, stash)
    const text = withoutFences.replace(INLINE_CODE_RE, stash)
    return {
        text,
        restore: rendered => (segments.length === 0
            ? rendered
            : rendered.replace(/\u0000DSA_CODE_(\d+)\u0000/g, (_m, i: string) => segments[Number(i)] ?? '')),
    }
}

/**
 * dsa3 的图标是内联 SVG（取自其 src/algorithmRegistry.ts 的 icons 表）。
 * anima1 的图标走自带的 fruit-icons 字体，只需 class 名。
 */
const DSA3_ICONS: Record<string, string> = {
    branch: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 6a9 9 0 0 0-9 9V3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/></g>',
    route: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></g>',
    component: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0zm-13.239 0a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0zm6.619 6.619a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0zm0-13.238a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/>',
    search: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></g>',
    layers: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></g>',
    scissors: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></g>',
    string: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2M9 8l3 4-3 4m6-8h.01M15 16h.01"/></g>',
    match: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M8 6l8 6M8 18h8"/></g><g fill="currentColor"><circle cx="6" cy="6" r="2"/><circle cx="6" r="2" cy="12"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></g>',
}

const ICON_FALLBACK = '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M8 5v14l11-7z"/></g>'

/** 读并校验快照。结构不对就抛错——快照是生成物，坏了要立刻发现。 */
export function loadDemoManifest(manifestPath: string): DemoManifest {
    const raw = fs.readFileSync(manifestPath, 'utf8')
    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    }
    catch (error) {
        throw new Error(`book/demos.json 不是合法 JSON: ${(error as Error).message}`)
    }
    const manifest = parsed as DemoManifest
    if (!manifest || typeof manifest !== 'object' || !manifest.sites || !manifest.demos) {
        throw new Error('book/demos.json 结构不正确：需要 sites 与 demos 两个字段')
    }
    return manifest
}

/** 解析 `slug` 或 `slug | 自定义标题`。 */
export function parseDsaSpec(spec: string): { slug: string, titleOverride?: string } | null {
    const bar = spec.indexOf('|')
    const slug = (bar >= 0 ? spec.slice(0, bar) : spec).trim()
    const override = bar >= 0 ? spec.slice(bar + 1).trim() : ''
    if (!slug) return null
    return { slug, titleOverride: override || undefined }
}

export function demoUrl(entry: DemoEntry, manifest: DemoManifest): string | null {
    const site = manifest.sites[entry.site]
    if (!site) return null
    return `${site.baseUrl.replace(/\/+$/, '')}${entry.path}`
}

function renderIcon(entry: DemoEntry): string {
    // anima1：自带 fruit-icons 字体，class 名即可。
    if (entry.site === 'anima1' && entry.icon) {
        return `<i class="fruit-icon ${escapeAttribute(entry.icon)}" aria-hidden="true"></i>`
    }
    // dsa3：优先用快照里的 SVG body（sync-demos 自动抓取，新增图标无需改本文件），
    // 旧快照没带 iconSvg 时回退到内置表，最后才是通用播放图标。
    const body = entry.iconSvg
        || (entry.icon && DSA3_ICONS[entry.icon])
        || ICON_FALLBACK
    return `<svg class="rbook-dsa-card__svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${body}</svg>`
}

function renderCard(entry: DemoEntry, manifest: DemoManifest, titleOverride?: string): string | null {
    const url = demoUrl(entry, manifest)
    // 站点缺失由调用方 report，这里只返回 null 表示无法生成卡片
    if (!url) return null

    const site = manifest.sites[entry.site]
    const title = titleOverride || entry.title
    // accent 只用于左侧色条；没有就不写内联样式，保持 CSS 默认。
    const style = entry.accent ? ` style="--rbook-dsa-accent:${escapeAttribute(entry.accent)}"` : ''
    const tags = Array.isArray(entry.tags) && entry.tags.length > 0
        ? `\n    <ul class="rbook-dsa-card__tags">${entry.tags
            .map(tag => `<li>${escapeHtml(tag)}</li>`)
            .join('')}</ul>`
        : ''
    const description = entry.description
        ? `\n    <p class="rbook-dsa-card__desc">${escapeHtml(entry.description)}</p>`
        : ''

    return [
        `<a class="rbook-dsa-card" href="${escapeAttribute(url)}" target="_blank" rel="noopener"${style}>`,
        `  <span class="rbook-dsa-card__icon">${renderIcon(entry)}</span>`,
        '  <span class="rbook-dsa-card__body">',
        `    <span class="rbook-dsa-card__title">${escapeHtml(title)}<span class="rbook-dsa-card__badge">${escapeHtml(site.label)}</span></span>${description}${tags}`,
        '  </span>',
        `  <span class="rbook-dsa-card__arrow" aria-hidden="true">↗</span>`,
        '</a>',
    ].join('\n')
}

function renderFailure(target: string, reason?: string): string {
    const detail = reason ? `（${escapeHtml(reason)}）` : ''
    return `<div class="rbook-dsa-card rbook-dsa-card--error" role="alert">动画链接无效: ${escapeHtml(target)}${detail}</div>`
}

/**
 * 在 Markdown 仍保有来源文件信息时展开指令。
 * include 插件也调用它，被包含片段里的卡片不会丢失来源信息。
 */
export function renderDsaDirectives(
    source: string,
    fromFile: string | undefined,
    manifest: DemoManifest,
    opts: DsaOptions,
): string {
    if (!source.includes('dsa')) return source

    const shielded = protectCodeSegments(source)
    const rendered = shielded.text.replace(DSA_RE, (_whole, rawSpec: string) => {
        const parsed = parseDsaSpec(rawSpec)
        if (!parsed) {
            report(opts, fromFile, rawSpec, '指令格式应为 [[[dsa: slug]]]')
            return renderFailure(rawSpec, '缺少 slug')
        }
        const entry = manifest.demos[parsed.slug]
        if (!entry) {
            report(opts, fromFile, parsed.slug, '演示未在 book/demos.json 注册')
            return renderFailure(parsed.slug, '未注册的演示')
        }
        const card = renderCard(entry, manifest, parsed.titleOverride)
        if (card === null) {
            report(opts, fromFile, parsed.slug, `站点 ${entry.site} 不在 demos.json 的 sites 表中`)
            return renderFailure(parsed.slug, `未知站点 ${entry.site}`)
        }
        return card
    })
    return shielded.restore(rendered)
}

function report(opts: DsaOptions, sourcePath: string | undefined, target: string, reason: string): void {
    opts.diagnostics?.push({
        phase: 'dsa',
        level: 'error',
        sourcePath,
        message: `动画卡片引用失败: ${target} (${reason})`,
    })
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

export default function dsaPlugin(md: MarkdownIt, opts: DsaOptions): void {
    const manifest = loadDemoManifest(opts.manifestPath)

    md.core.ruler.before('normalize', 'rbook_dsa', function dsa(state) {
        const env = (state.env || {}) as Record<string, unknown>
        const fromFile = env.currentMdFilePath as string | undefined
        state.src = renderDsaDirectives(state.src, fromFile, manifest, opts)
        return true
    })
}
