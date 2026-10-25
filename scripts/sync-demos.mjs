#!/usr/bin/env node
/**
 * sync-demos.mjs — 从两个动画站仓库重新生成 book/demos.json 快照。
 *
 * 两个动画仓库都不发布机器可读的清单：
 *   - anima1（dsa/）：静态站点，演示名只能从 index.html 的目录条目里读，
 *     标题来自各演示自己的 <title>，图标来自目录里的 fruit-icon class。
 *   - dsa3（dsa3_ts/）：Vue 站点，元数据在 src/algorithmRegistry.ts 里，
 *     但那是 .ts 源码，所以这里按文本解析（不执行、不 import）。
 *
 * 因此本脚本是「重新抓取」工具，而不是构建的一部分：书仓库的构建只读
 * 已提交的 book/demos.json，不跨仓库依赖（服务器/CI 上没有这两个仓库）。
 *
 * 用法：
 *   node scripts/sync-demos.mjs                 # 自动探测 ../dsa 与 ../dsa3_ts
 *   node scripts/sync-demos.mjs --check         # 只报告差异，不写文件
 *   node scripts/sync-demos.mjs --anima1-dir=/x/dsa --dsa3-dir=/x/dsa3_ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const OUT_FILE = path.join(PROJECT_ROOT, 'book', 'demos.json')

/**
 * 退出码约定（deploy.sh 依赖它区分两类失败）：
 *   0 = 一致 / 已写入
 *   1 = 快照与远端不一致（快照陈旧，需要重跑生成本脚本）
 *   2 = 用法错误
 *   3 = 环境问题（找不到动画仓库 / 注册表解析失败）——无法校验，不代表陈旧
 */
const EXIT_STALE = 1
const EXIT_USAGE = 2
const EXIT_ENV = 3

/** 站点基址。改域名只需改这里并重跑本脚本。 */
const SITES = {
    anima1: {
        baseUrl: 'https://anima1.roj.ac.cn',
        label: 'anima1',
        title: '数据结构与算法动画',
    },
    dsa3: {
        baseUrl: 'https://dsa3.roj.ac.cn',
        label: 'dsa3',
        title: 'DSA3 算法动画',
    },
}

function parseArgs(argv) {
    const opts = { check: false, anima1Dir: null, dsa3Dir: null }
    for (const arg of argv.slice(2)) {
        if (arg === '--check') opts.check = true
        else if (arg.startsWith('--anima1-dir=')) opts.anima1Dir = arg.slice('--anima1-dir='.length)
        else if (arg.startsWith('--dsa3-dir=')) opts.dsa3Dir = arg.slice('--dsa3-dir='.length)
        else {
            console.error(`未知参数: ${arg}`)
            process.exit(EXIT_USAGE)
        }
    }
    return opts
}

/** 按兄弟目录约定探测动画仓库位置。 */
function detectDir(explicit, candidates, marker) {
    if (explicit) {
        if (!fs.existsSync(path.join(explicit, marker))) {
            throw new Error(`指定目录缺少 ${marker}: ${explicit}`)
        }
        return path.resolve(explicit)
    }
    for (const candidate of candidates) {
        const full = path.resolve(PROJECT_ROOT, candidate)
        if (fs.existsSync(path.join(full, marker))) return full
    }
    throw new Error(
        `找不到动画仓库（期望包含 ${marker}），可用 --anima1-dir / --dsa3-dir 指定。已尝试: ${candidates.join(', ')}`,
    )
}

function decodeEntities(value) {
    return value
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
}

/** 读取一个 HTML 文件的 <title>，并去掉站点后缀。 */
function readTitle(htmlFile) {
    if (!fs.existsSync(htmlFile)) return null
    const html = fs.readFileSync(htmlFile, 'utf8')
    const match = /<title>([\s\S]*?)<\/title>/i.exec(html)
    if (!match) return null
    const raw = decodeEntities(match[1]).trim()
    // 站点页标题统一写成「演示名 | 站点名」，快照只保留演示名。
    return raw.split('|')[0].trim() || null
}

/** anima1：静态目录站点，扫描 public/index.html 的目录条目。 */
function collectAnima1(dir) {
    const publicDir = path.join(dir, 'public')
    const indexFile = path.join(publicDir, 'index.html')
    if (!fs.existsSync(indexFile)) {
        throw new Error(`anima1 缺少目录页: ${indexFile}`)
    }
    const html = fs.readFileSync(indexFile, 'utf8')

    // 目录条目形如：
    //   <a class="algorithm-link" href="/quickSort/"><i class="fruit-icon icon-dayouzi"></i>
    //       <span class="algorithm-link__name">快速排序<span class="algorithm-link__id">quickSort</span></span>
    const items = []
    const linkRe = /<a\b[^>]*class="[^"]*algorithm-link[^"]*"[^>]*href="\/([^"\/]+)\/"[^>]*>([\s\S]*?)<\/a>/g
    for (const match of html.matchAll(linkRe)) {
        const slug = match[1]
        const body = match[2]
        const iconMatch = /class="fruit-icon\s+(icon-[A-Za-z0-9]+)"/.exec(body)
        const nameMatch = /<span class="algorithm-link__name">([\s\S]*?)<span class="algorithm-link__id">/.exec(body)
        const dirName = nameMatch ? decodeEntities(nameMatch[1]).trim() : null
        items.push({
            slug,
            // 目录页的名字是权威标题；<title> 兜底（两者应一致）。
            title: dirName || readTitle(path.join(publicDir, slug, 'index.html')) || slug,
            icon: iconMatch ? iconMatch[1] : null,
        })
    }

    // 目录页漏登但目录确实存在的演示：补进来，避免快照漏项。
    const seen = new Set(items.map(i => i.slug))
    for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        if (entry.name === 'assets') continue
        if (seen.has(entry.name)) continue
        if (!fs.existsSync(path.join(publicDir, entry.name, 'index.html'))) continue
        items.push({
            slug: entry.name,
            title: readTitle(path.join(publicDir, entry.name, 'index.html')) || entry.name,
            icon: null,
        })
    }

    return items
}

/** dsa3：从 algorithmRegistry.ts 按文本解析条目与图标表。 */
function collectDsa3(dir) {
    const registryFile = path.join(dir, 'src', 'algorithmRegistry.ts')
    if (!fs.existsSync(registryFile)) {
        throw new Error(`dsa3 缺少注册表: ${registryFile}`)
    }
    const src = fs.readFileSync(registryFile, 'utf8')

    // 图标名 -> SVG body。把 body 直接写进快照，插件就不需要再维护一份
    // 硬编码的图标表；dsa3 新增图标时无需同步修改书仓库。
    const iconBodies = new Map()
    const iconBlockStart = src.indexOf('const icons = {')
    const iconBlockEnd = src.indexOf('} satisfies Record')
    if (iconBlockStart >= 0 && iconBlockEnd > iconBlockStart) {
        const block = src.slice(iconBlockStart, iconBlockEnd)
        for (const match of block.matchAll(/(\w+):\s*\{\s*body:\s*'((?:[^'\\]|\\.)*)'/g)) {
            iconBodies.set(match[1], match[2])
        }
    }

    const arrayStart = src.indexOf('export const algorithmRegistry')
    if (arrayStart < 0) throw new Error('dsa3 注册表里找不到 algorithmRegistry')
    let body = src.slice(arrayStart)

    const items = []
    // 每个条目以 id: '...' 开头；逐个切片后在同一片里取其余字段，
    // 比用一个巨型正则跨字段匹配更耐字段顺序变化。
    const idRe = /\n\s*id:\s*'([^']+)'/g
    const starts = [...body.matchAll(idRe)].map(m => m.index)
    starts.forEach((start, i) => {
        const end = i + 1 < starts.length ? starts[i + 1] : body.length
        const chunk = body.slice(start, end)
        const pick = re => {
            const m = re.exec(chunk)
            return m ? m[1] : null
        }
        const slug = /id:\s*'([^']+)'/.exec(chunk)[1]
        const tagsRaw = pick(/\btags:\s*\[([^\]]*)\]/)
        const tags = tagsRaw
            ? tagsRaw.split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
            : []
        const icon = pick(/\bicon:\s*icons\.(\w+)/)
        items.push({
            slug,
            title: pick(/\btitle:\s*'([^']*)'/),
            description: pick(/\bdescription:\s*'([^']*)'/),
            tags,
            accent: pick(/\baccent:\s*'(#[0-9A-Fa-f]{3,8})'/),
            // 图标名只用于快照可读性；真正渲染用的是 iconSvg
            icon: icon && iconBodies.has(icon) ? icon : null,
            iconSvg: icon && iconBodies.has(icon) ? iconBodies.get(icon) : null,
        })
    })

    return items
}

function buildSnapshot({ anima1Dir, dsa3Dir }) {
    const demos = {}

    for (const item of collectAnima1(anima1Dir)) {
        if (demos[item.slug]) {
            throw new Error(`slug 冲突: ${item.slug}（anima1 内部重复）`)
        }
        demos[item.slug] = {
            site: 'anima1',
            path: `/${item.slug}/`,
            title: item.title,
            icon: item.icon,
        }
    }

    for (const item of collectDsa3(dsa3Dir)) {
        if (demos[item.slug]) {
            throw new Error(
                `slug 冲突: ${item.slug} 同时出现在 anima1 与 dsa3。`
                + '需要使用带站点前缀的语法才能区分，请先决定命名空间方案。',
            )
        }
        const entry = {
            site: 'dsa3',
            path: `/Animate/${item.slug}/`,
            title: item.title || item.slug,
            icon: item.icon,
        }
        // 描述/标签/配色/svg 图标都是 dsa3 独有的，缺就不写，避免快照里出现空字段。
        if (item.iconSvg) entry.iconSvg = item.iconSvg
        if (item.description) entry.description = item.description
        if (item.tags && item.tags.length > 0) entry.tags = item.tags
        if (item.accent) entry.accent = item.accent
        demos[item.slug] = entry
    }

    // 键排序，保证重跑脚本得到逐字节相同的文件，diff 才有意义。
    const sorted = {}
    for (const key of Object.keys(demos).sort((a, b) => a.localeCompare(b))) {
        sorted[key] = demos[key]
    }

    return {
        _comment: '由 scripts/sync-demos.mjs 生成，请勿手改；跑该脚本可重新抓取两个动画站。',
        sites: SITES,
        demos: sorted,
    }
}

function main() {
    const opts = parseArgs(process.argv)
    let anima1Dir
    let dsa3Dir
    try {
        anima1Dir = detectDir(opts.anima1Dir, ['../dsa', '../dsa1'], path.join('public', 'index.html'))
        dsa3Dir = detectDir(opts.dsa3Dir, ['../dsa3_ts', '../dsa3'], path.join('src', 'algorithmRegistry.ts'))
    }
    catch (error) {
        console.error(`无法校验：${error.message}`)
        process.exit(EXIT_ENV)
    }

    let snapshot
    try {
        snapshot = buildSnapshot({ anima1Dir, dsa3Dir })
    }
    catch (error) {
        console.error(`无法校验：${error.message}`)
        process.exit(EXIT_ENV)
    }
    const next = JSON.stringify(snapshot, null, 2) + '\n'
    const count = Object.keys(snapshot.demos).length

    if (opts.check) {
        // 快照缺失与快照陈旧是两回事：缺失说明还没生成过（新 clone、或在
        // 未入库的机器上），属于环境问题；陈旧才是真的需要重跑本脚本。
        // 混为一谈会让 deploy.sh 在快照不存在时误报“动画站不一致”并中止。
        if (!fs.existsSync(OUT_FILE)) {
            console.error(`无法校验：${path.relative(PROJECT_ROOT, OUT_FILE)} 不存在，先跑一次 node scripts/sync-demos.mjs`)
            process.exit(EXIT_ENV)
        }
        const prev = fs.readFileSync(OUT_FILE, 'utf8')
        if (prev === next) {
            console.log(`OK: book/demos.json 与远端一致（${count} 个演示）`)
            return
        }
        console.error(`book/demos.json 已过期，请运行 node scripts/sync-demos.mjs 重新生成（${count} 个演示）`)
        process.exit(EXIT_STALE)
    }

    fs.writeFileSync(OUT_FILE, next)
    const bySite = {}
    for (const demo of Object.values(snapshot.demos)) {
        bySite[demo.site] = (bySite[demo.site] || 0) + 1
    }
    const detail = Object.entries(bySite).map(([site, n]) => `${site}=${n}`).join(', ')
    console.log(`写入 ${path.relative(PROJECT_ROOT, OUT_FILE)}: ${count} 个演示（${detail}）`)
}

main()
