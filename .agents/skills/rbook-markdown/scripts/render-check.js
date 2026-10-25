#!/usr/bin/env node
/**
 * render-check.js — 用项目真实渲染管线把一篇文章转成 HTML，并扫描"方言用错"的痕迹。
 *
 * 为什么不用预览/肉眼检查：本项目的很多方言失效是**静默**的
 * （未注册的 container 变成普通文字、`[g1:cpp]` 被忽略、`[[wikilink]]` 原样输出）。
 * 只有跑真实渲染器才能看到最终产物。
 *
 * 用法（在项目根目录运行；先 `npm run prepare` 生成 .tsbuild）：
 *   node .agents/skills/rbook-markdown/scripts/render-check.js graph/bellman-ford
 *   node .agents/skills/rbook-markdown/scripts/render-check.js graph/spfa/index.md --html
 *
 * 退出码：0 = 干净；1 = 有可疑残留或 error 级诊断；2 = 用法/环境错误。
 */
const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()
const tsbuild = path.join(projectRoot, '.tsbuild/publishing')

function need(rel) {
    const p = path.join(tsbuild, rel)
    if (!fs.existsSync(p)) {
        console.error('缺少编译产物: ' + p + '\n请先运行: npm run prepare')
        process.exit(2)
    }
    return require(p)
}

const args = process.argv.slice(2)
const showHtml = args.includes('--html')
const target = args.find(a => !a.startsWith('--'))
if (!target) {
    console.error('用法: node render-check.js <book 相对路径或文章目录> [--html]')
    process.exit(2)
}

const { PathPolicy } = need('content/path-policy.js')
const { loadCatalog } = need('content/catalog-loader.js')
const { flattenCatalog } = need('domain/catalog.js')
const { resolveArticleSource } = need('content/source-resolver.js')
const { buildArticleIndex } = need('domain/index.js')
const { PageTemplateRenderer } = need('templates/page-template-renderer.js')
const { renderArticle } = need('pipeline/render-article.js')

const policy = new PathPolicy(projectRoot)
const catalog = loadCatalog(path.join(projectRoot, 'book/catalog.yaml'))
const entries = flattenCatalog(catalog).map(leaf => {
    const r = resolveArticleSource(leaf, policy.book, [])
    return {
        id: r.metadata.id,
        title: r.metadata.title,
        sourcePath: r.source.filePath,
        publishHref: policy.publishHref(r.source.filePath),
        metadata: r.metadata,
    }
})
const index = buildArticleIndex(catalog, entries)
const templateRenderer = new PageTemplateRenderer({
    templateDir: path.join(projectRoot, 'src/ejs'),
    root: projectRoot,
    menuHtml: '',
})

/**
 * 允许省略 .md：<target>.md → <target>/index.md → <target>（仅当它是文件）。
 * 注意别让目录名直接命中第一项，否则后面读源码会 EISDIR、扫描被静默跳过。
 */
function resolveEntry(t) {
    const candidates = [t, t + '.md', path.join(t, 'index.md')]
    const isFile = c => {
        const abs = path.join(projectRoot, 'book', c)
        return fs.existsSync(abs) && fs.statSync(abs).isFile()
    }
    for (const c of candidates) {
        if (isFile(c)) return c
    }
    return t
}

const diag = []
let result
const entryPath = resolveEntry(target)
try {
    result = renderArticle({
        entryPath,
        policy,
        index,
        templateRenderer,
        diagnostics: diag,
        debug: true,
    })
}
catch (err) {
    console.error('渲染失败: ' + entryPath + '\n' + (err && err.message ? err.message : String(err)))
    process.exit(2)
}

/**
 * 检查分两层：
 *   A) **源码层**：`:::` 名字、`[[[type:]]]` 类型、双方括号、`++`/`==`/脚注/`[g1:]`。
 *      这些「没生效的写法」在 HTML 里往往已经变成普通文字，只能回源码判断。
 *      先剥掉围栏代码块与行内代码，避免把作者**有意展示**的示例判成错误。
 *   B) **产物层**：include 失败 / 动画失败 / 链接 missing 这些显式失败标记。
 */
function stripFencesAndCodes(src) {
    // 用等长空白替换（保留换行），这样命中下标仍然能换算回原始行号。
    const blank = m => m.replace(/[^\n]/g, ' ')
    return src
        // 围栏代码块（``` 或 ~~~，允许 info 串）
        .replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, blank)
        // 行内代码（成对的 n 个反引号）
        .replace(/(`+)[^`]*?\1/g, blank)
        // 数学：`$$…$$` 与 `$…$` 里出现 == 或 ++ 是公式本身，不是失效方言
        .replace(/\$\$[\s\S]*?\$\$/g, blank)
        .replace(/\$[^$\n]*\$/g, blank)
}

/**
 * 只扫**本文件自己的正文**。
 * 文章的 HTML 里混着被 include 进来的片段，如果直接扫产物，
 * 会把 `index.md` 的检查结果算到片段头上（行号也对不上）。
 * 这里按 include 插件同样的规则把片段内联后再切片，保证行号指向当前文件。
 */
const INCLUDE_RE = /\[\[\[\s*include\s*:\s*([^\]]+?)\s*\]\]\]/g
const FENCE_FILE_RE = /(?:^|\s)file\s*=\s*(?:"([^"]+)"|'([^']+)'|(\S+))/

/** 参与本次扫描的所有源文件（本文件 + 递归 include 进来的片段）。 */
const scanSources = []

function expandIncludes(text, fromFile, depth = 0) {
    if (depth > 8) return text
    if (!scanSources.some(s => s.abs === fromFile)) scanSources.push({ abs: fromFile, text })
    return text.replace(INCLUDE_RE, (_w, rawTarget) => {
        const target = rawTarget.trim().replace(/^["']|["']$/g, '')
        const abs = target.startsWith('/')
            ? path.join(projectRoot, 'book', target.replace(/^\/+/, ''))
            : path.resolve(path.dirname(fromFile), target)
        try {
            return expandIncludes(fs.readFileSync(abs, 'utf8'), abs, depth + 1)
        }
        catch {
            return ''
        }
    })
}

/** 把 `file=` 注入的内容也换成空白：我们的输出只以“本文件写下的内容”为准。 */
function blankFileFences(text) {
    return text.replace(/^[ \t]*(`{3,}|~{3,})([^\n]*\n[\s\S]*?)^[ \t]*\1[ \t]*$/gm,
        (whole, _fence, info) => (FENCE_FILE_RE.test(info) ? whole.replace(/[^\n]/g, ' ') : whole))
}

const sourcePath = path.join(projectRoot, 'book', entryPath)
let rawSource = ''
try {
    rawSource = fs.readFileSync(sourcePath, 'utf8')
}
catch {
    rawSource = ''
}
const expanded = blankFileFences(expandIncludes(rawSource, sourcePath))
const scan = stripFencesAndCodes(expanded)

/**
 * 命中位置 -> 「哪个文件第几行」。
 * 扫描用的是展开 include 之后的文本，下标已与任何单个文件脱钩，
 * 因此拿命中的字面量回各个源文件里顺序查找（同一片段重复出现时依次推进）。
 */
const searchCursor = new Map()
function locatedAt(text) {
    for (const file of [scanSources[0], ...scanSources.slice(1)]) {
        if (!file) continue
        const key = file.abs + '\u0000' + text
        const from = searchCursor.get(key) || 0
        let at = file.text.indexOf(text, from)
        if (at < 0) at = file.text.indexOf(text)
        if (at < 0) continue
        searchCursor.set(key, at + text.length)
        return {
            line: file.text.slice(0, at).split('\n').length,
            file: path.relative(path.join(projectRoot, 'book'), file.abs).replace(/\\/g, '/'),
        }
    }
    return { line: null, file: null }
}

/** 只扫正文区域的 HTML（避免命中页面模板）。 */
const bodyMatch = result.html.match(/<div class="markdown-body">([\s\S]*)<\/article>/)
const body = bodyMatch ? bodyMatch[1] : result.html

const found = []
const push = (why, count, sample, loc) => found.push({ why, count, sample, loc })

// --- A1) 未知类型的三方括号指令 -------------------------------------------
const KNOWN_DIRECTIVES = new Set([
    'rbook', 'p', 'pp', 'problem', 'problem_info_solution', 'include', 'animate', 'dsa',
])
for (const m of scan.matchAll(/\[\[\[\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)) {
    if (KNOWN_DIRECTIVES.has(m[1].toLowerCase())) continue
    push('未知指令类型 [[[' + m[1] + ': …]]]，不会被渲染（只会输出文字）', 1,
        m[0].slice(0, 80), locatedAt(m[0]))
}

// --- A2) 双方括号（先把合法三方括号抹掉） ---------------------------------
// 同样用等长空白替换，保证下标仍可换算回原始行号。
// `[[TOC]]` / `[[toc]]` 是**合法**的目录占位符（markdown-it-toc-done-right 认它），别误报。
const noTriple = scan
    .replace(/\[\[\[[^\]]*\]\]\]/g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\[\[\s*toc\s*\]\]/gi, m => m.replace(/[^\n]/g, ' '))
const dbRe = /\[\[[^[\]]{1,80}\]\]/g
const dbHits = [...noTriple.matchAll(dbRe)]
if (dbHits.length) {
    push('双方括号不是本项目方言（站内链接写 [[[rbook: id]]]）', dbHits.length,
        dbHits[0][0].slice(0, 80), locatedAt(dbHits[0][0]))
}

// --- A3) 其余“看起来能写、其实不支持”的写法 -------------------------------
const SOURCE_CHECKS = [
    {
        re: /^[ \t]*:::[ \t]*(?!fold\b|colorfulbox\b|blackboard\b|info\b|warning\b|error\b|oneWordAlgo\b|pseudocode\b|$)[A-Za-z]\w*/gm,
        why: '未注册的 ::: 容器名，会原样输出成普通文字',
    },
    { re: /\+\+[^+\n]{1,60}\+\+/g, why: '++插入++ 不是本项目方言，请用 <ins>' },
    { re: /==[^=\n]{1,60}==/g, why: '==高亮== 不是本项目方言，请用 <mark>' },
    { re: /\[\^[^\]\n]{1,40}\]/g, why: '脚注语法未启用，[^1] 会变成奇怪的链接/文字' },
    { re: /\[g\d+:[^\]]*\]/g, why: '[g1:xxx] code tab 标记未实现，会被静默忽略' },
]
for (const { re, why } of SOURCE_CHECKS) {
    const hits = [...noTriple.matchAll(re)]
    if (hits.length) {
        push(why, hits.length, hits[0][0].slice(0, 80), locatedAt(hits[0][0]))
    }
}

// --- B) 产物里的显式失败标记 ---------------------------------------------
const MARKER_CHECKS = [
    { re: /include-missing/g, why: 'include 目标不存在或路径越界' },
    { re: /rbook-animation--error/g, why: 'animate 目标不存在、越界或不是 .animation.ts' },
    { re: /rbook-dsa-card--error/g, why: 'dsa 卡片的 slug 未在 book/demos.json 注册（或站点缺失）' },
    { re: /extra-link missing/g, why: 'rbook / 题目链接找不到目标' },
]
for (const { re, why } of MARKER_CHECKS) {
    const hits = body.match(re)
    if (hits && hits.length) push(why, hits.length, hits[0])
}

const errors = diag.filter(d => d.level === 'error')

console.log('=== ' + entryPath + ' ===')
console.log('正文 HTML 长度: ' + body.length + (showHtml ? '' : '（加 --html 打印正文）'))
// 用 process.stdout.write 而非 console.log：正文 HTML 可达数百 KB，
// console.log 在输出管道（| grep / | wc）时会因背压丢掉尾部，
// 导致统计结果偏小（实际 285KB 只输出 65KB）。
if (showHtml) process.stdout.write(body + '\n')

if (found.length === 0) {
    console.log('✅ 没有发现方言残留')
}
else {
    console.log('⚠️ 可疑残留:')
    for (const f of found) {
        const where = f.loc && f.loc.file
            ? '  ' + f.loc.file + (f.loc.line ? ':' + f.loc.line : '')
            : ''
        console.log('  - [' + f.count + ' 处] ' + f.why + where)
        console.log('    例: ' + f.sample)
    }
}

if (diag.length) {
    console.log('--- 诊断 (' + diag.length + ') ---')
    for (const d of diag) {
        const where = d.sourcePath ? ' @ ' + path.relative(projectRoot, d.sourcePath) : ''
        const line = d.line ? ':' + d.line : ''
        console.log('  ' + d.level + where + line + ' ' + d.message)
        if (d.suggestion) console.log('      → ' + d.suggestion)
    }
}

// 用 process.exitCode 而不是 process.exit()：后者会立即终止进程，
// 丢掉 stdout 尚未 flush 的缓冲区，使长正文（数百 KB）被截断。
// 设置 exitCode 后让 Node 自然退出，输出才完整。
process.exitCode = found.length === 0 && errors.length === 0 ? 0 : 1
