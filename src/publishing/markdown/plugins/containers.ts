import container from 'markdown-it-container'
import type MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it'
import type { Diagnostic } from '../../domain/diagnostics'

/**
 * 带类型的方框：`::: kind [标题] [id=…] [icon=…] [label=…]`。
 *
 * 设计见 docs/adr/0014-typed-boxes.md。要点有三条：
 * 1. 类型进语法（kind 决定标签、色组、默认图标），标题也进语法，不再把容器第一段
 *    靠 CSS 绝对定位拔出来当胶囊——那会让长标题被省略号吃掉、让首节点是图片/公式/
 *    代码的块整段脱离文档流。
 * 2. 标题是行内内容，交给 md.renderInline 渲染，因此 `$数学$`、`**加粗**`、
 *    `` `代码` `` 在标题里都生效。
 * 3. 旧容器名（colorfulbox / oneWordAlgo / warning / info / error / blackboard）
 *    一律移除；写了不认识的 kind 会记一条诊断，而不是静默变成正文。
 */

type Hue = 'accent' | 'muted' | 'warning'
type IconName = 'warning' | 'info' | 'bulb' | 'star' | 'scale'

interface KindSpec {
    /** 默认标签文字。 */
    label: string
    /** 色组：蓝 = 在陈述某件事，灰 = 依附于前文的附属内容，琥珀 = 读者容易错。 */
    hue: Hue
    /** 默认图标，只有 warn 自带。 */
    icon?: IconName
}

const KINDS: Record<string, KindSpec> = {
    definition: { label: '定义', hue: 'accent' },
    theorem: { label: '定理', hue: 'accent' },
    lemma: { label: '引理', hue: 'accent' },
    corollary: { label: '推论', hue: 'accent' },
    algorithm: { label: '算法', hue: 'accent' },
    note: { label: '说明', hue: 'accent' },
    proof: { label: '证明', hue: 'muted' },
    example: { label: '例', hue: 'muted' },
    summary: { label: '总结', hue: 'muted' },
    warn: { label: '注意', hue: 'warning', icon: 'warning' },
}

/** 中文 kind 名与英文名等价，内部一律存英文名（它同时是 CSS 类名的一部分）。 */
const KIND_ALIASES: Record<string, string> = {
    定义: 'definition',
    定理: 'theorem',
    引理: 'lemma',
    推论: 'corollary',
    算法: 'algorithm',
    说明: 'note',
    证明: 'proof',
    例: 'example',
    例题: 'example',
    举例: 'example',
    总结: 'summary',
    注意: 'warn',
    警告: 'warn',
}

/** 1em 见方的内联图标，画法与 [[[rbook:]]] 的 LINK_MARKS 一致：只描边，不填充。 */
const ICON_PATHS: Record<IconName, string> = {
    warning: '<path d="M12 3.6 2.6 20.4h18.8z"/><path d="M12 9.4v4.6"/><path d="M12 17.2h.01"/>',
    info: '<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.6"/><path d="M12 7.9h.01"/>',
    bulb: '<path d="M12 3.4a6 6 0 0 0-3.6 10.8v2.2h7.2v-2.2A6 6 0 0 0 12 3.4z"/><path d="M9.6 19h4.8"/><path d="M10.4 21.4h3.2"/>',
    star: '<path d="M12 3.6 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 9.9l6-.9z"/>',
    scale: '<path d="M12 4v16"/><path d="M7.4 20h9.2"/><path d="M4.4 8.8h15.2"/><path d="M4.4 8.8 2.2 14a2.9 2.9 0 0 0 4.4 0z"/><path d="M19.6 8.8 17.4 14a2.9 2.9 0 0 0 4.4 0z"/>',
}

export interface ContainersPluginOptions {
    diagnostics?: Diagnostic[]
    /** 当前文章源路径（诊断定位用）。 */
    currentSourcePath?: string
}

interface BoxInfo {
    /** 规范化后的 kind 名；不认识的 kind 为 null。 */
    kind: string | null
    /** kind 的原词，用于诊断提示。 */
    rawKind: string
    title: string
    id?: string
    label?: string
    icon?: string
}

const KIND_RE = /^([A-Za-z][\w-]*|[\u4e00-\u9fff]+)([\s\S]*)$/
const OPTION_RE = /^(id|icon|label)=/
const OPTION_SPLIT_RE = /(?:^|\s)(id|icon|label)=/

function normalizeKind(raw: string): string | null {
    const lower = raw.toLowerCase()
    if (KINDS[lower]) return lower
    const alias = KIND_ALIASES[raw]
    return alias || null
}

/**
 * 解析 info string：`kind 标题 id=x icon=y`。
 *
 * 标题是位置参数，可以带空格与中文标点；从第一个 `key=value` 片段起剩下的都按选项
 * 解析。标题里要出现 `=` 时用双引号包起来，或者直接写成 `title="…"` 的形式。
 */
export function parseBoxInfo(info: string): BoxInfo | null {
    const text = info.trim()
    const m = KIND_RE.exec(text)
    if (!m) return null

    const rawKind = m[1]
    let rest = m[2].trim()
    const box: BoxInfo = { kind: normalizeKind(rawKind), rawKind, title: '' }

    // 双引号标题：从开头引号到下一个引号之间全是标题，之后才算选项。
    if (rest.startsWith('"')) {
        const end = rest.indexOf('"', 1)
        if (end === -1) return null
        box.title = rest.slice(1, end)
        rest = rest.slice(end + 1).trim()
    } else if (rest.toLowerCase().startsWith('title=')) {
        // title="…" 的写法，允许标题里出现 =
        const raw = rest.slice('title='.length).trim()
        if (raw.startsWith('"')) {
            const end = raw.indexOf('"', 1)
            if (end === -1) return null
            box.title = raw.slice(1, end)
            rest = raw.slice(end + 1).trim()
        } else {
            const sep = OPTION_SPLIT_RE.exec(raw)
            const cut = sep && sep.index > 0 ? sep.index : raw.length
            box.title = raw.slice(0, cut).trim()
            rest = raw.slice(cut).trim()
        }
    }

    if (rest && !box.title) {
        // 位置标题在选项之前：从第一个 `key=value` 处切开
        const sep = OPTION_SPLIT_RE.exec(rest)
        const cut = sep ? sep.index : rest.length
        box.title = rest.slice(0, cut).trim()
        rest = rest.slice(cut).trim()
    }

    for (const token of rest.split(/\s+/)) {
        if (!token) continue
        const eq = token.indexOf('=')
        if (eq === -1) continue
        const key = token.slice(0, eq)
        const value = token.slice(eq + 1)
        if (!value) continue
        if (key === 'id') box.id = value
        else if (key === 'label') box.label = value
        else if (key === 'icon') box.icon = value
    }

    return box
}

function iconMarkup(name: string): { html: string; known: boolean } {
    if (name === 'none') return { html: '', known: true }
    const paths = ICON_PATHS[name as IconName]
    if (!paths) return { html: '', known: false }
    return {
        html: `<svg class="rbook-box__icon" viewBox="0 0 24 24" role="presentation" aria-hidden="true" focusable="false">${paths}</svg>`,
        known: true,
    }
}

export default function containersPlugin(md: MarkdownIt, opts: ContainersPluginOptions = {}): void {
    const seen = new Set<string>()

    function warn(line: number | undefined, message: string, suggestion?: string): void {
        const key = `${line}:${message}`
        if (seen.has(key)) return
        seen.add(key)
        opts.diagnostics?.push({
            phase: 'containers',
            level: 'warning',
            sourcePath: opts.currentSourcePath,
            line,
            message,
            suggestion,
        })
    }

    md.use(container, 'rbookBox', {
        validate: (params: string) => {
            const box = parseBoxInfo(params)
            return Boolean(box && box.kind)
        },
        render(tokens: Token[], idx: number) {
            const token = tokens[idx]
            const line = (token.map?.[0] ?? 0) + 1

            if (token.nesting !== 1) return '</div>\n</div>\n'

            const box = parseBoxInfo(token.info)
            if (!box || !box.kind) return '<div class="rbook-box">\n<div class="rbook-box__body">\n'

            const spec = KINDS[box.kind]
            const label = box.label ?? spec.label
            const icon = iconMarkup(box.icon ?? spec.icon ?? 'none')
            if (!icon.known) {
                warn(line, `未知的图标名: icon=${box.icon}`, `可选 ${Object.keys(ICON_PATHS).join(' / ')} / none`)
            }

            const title = box.title ? `<span class="rbook-box__title">${md.renderInline(box.title)}</span>` : ''
            const id = box.id ? ` id="${md.utils.escapeHtml(box.id)}"` : ''

            return (
                `<div class="rbook-box rbook-box--${box.kind} rbook-box--hue-${spec.hue}"${id}>\n` +
                `<div class="rbook-box__head">${icon.html}<span class="rbook-box__kind">${md.utils.escapeHtml(label)}</span>${title}</div>\n` +
                '<div class="rbook-box__body">\n'
            )
        },
    })

    md.use(container, 'fold', {
        validate: (params: string) => /^fold(\s|$)/i.test(params.trim()),
        render(tokens: Token[], idx: number) {
            if (tokens[idx].nesting !== 1) return '</article></details>\n'
            const params = tokens[idx].info.trim()
            const title = params.slice('fold'.length).trim()
            const summary = title ? md.renderInline(title) : '点击'
            return `<details><summary>${summary}</summary>\n<article>`
        },
    })

    // 未注册的 `:::` 名字在今天会静默变成一行正文，这是本项目最容易出错的坑。
    // 容器没被消费时就退化成以 `:::` 开头的行内 token，扫一遍点出文件与行号。
    md.core.ruler.push('rbookBoxUnknownKind', (state) => {
        for (const token of state.tokens) {
            if (token.type !== 'inline') continue
            const first = token.content.split('\n', 1)[0].trim()
            const m = /^:::\s*(\S+)/.exec(first)
            if (!m) continue
            const name = m[1].replace(/:+$/, '')
            if (!name) continue
            const line = (token.map?.[0] ?? 0) + 1
            warn(
                line,
                `未注册的 ::: 容器名 \`::: ${name}\`，会原样输出成普通文字`,
                `方框请写 ::: 定义 / ::: 定理 / ::: 注意 等（见 docs/adr/0014-typed-boxes.md）`,
            )
        }
        return true
    })
}
