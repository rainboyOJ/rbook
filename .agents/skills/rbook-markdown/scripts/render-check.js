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

/** 允许省略 .md：先按给出的路径，再试 <target>.md。 */
function resolveEntry(t) {
    const candidates = [t, t + '.md', path.join(t, 'index.md')]
    for (const c of candidates) {
        if (fs.existsSync(path.join(projectRoot, 'book', c))) return c
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
}

const sourcePath = path.join(projectRoot, 'book', entryPath)
let rawSource = ''
try {
    rawSource = fs.readFileSync(sourcePath, 'utf8')
}
catch {
    rawSource = ''
}
const scan = stripFencesAndCodes(rawSource)
const lineOf = (index) => rawSource.slice(0, index).split('\n').length

/** 只扫正文区域的 HTML（避免命中页面模板）。 */
const bodyMatch = result.html.match(/<div class="markdown-body">([\s\S]*)<\/article>/)
const body = bodyMatch ? bodyMatch[1] : result.html

const found = []
const push = (why, count, sample, line) => found.push({ why, count, sample, line })

// --- A1) 未知类型的三方括号指令 -------------------------------------------
const KNOWN_DIRECTIVES = new Set([
    'rbook', 'p', 'pp', 'problem', 'problem_info_solution', 'include', 'animate',
])
for (const m of scan.matchAll(/\[\[\[\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g)) {
    if (KNOWN_DIRECTIVES.has(m[1].toLowerCase())) continue
    push('未知指令类型 [[[' + m[1] + ': …]]]，不会被渲染（只会输出文字）', 1,
        m[0].slice(0, 80), lineOf(m.index))
}

// --- A2) 双方括号（先把合法三方括号抹掉） ---------------------------------
// 同样用等长空白替换，保证下标仍可换算回原始行号。
const noTriple = scan.replace(/\[\[\[[^\]]*\]\]\]/g, m => m.replace(/[^\n]/g, ' '))
const dbRe = /\[\[[^[\]]{1,80}\]\]/g
const dbHits = [...noTriple.matchAll(dbRe)]
if (dbHits.length) {
    push('双方括号不是本项目方言（站内链接写 [[[rbook: id]]]）', dbHits.length,
        dbHits[0][0].slice(0, 80), lineOf(dbHits[0].index))
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
        push(why, hits.length, hits[0][0].slice(0, 80), lineOf(hits[0].index))
    }
}

// --- B) 产物里的显式失败标记 ---------------------------------------------
const MARKER_CHECKS = [
    { re: /include-missing/g, why: 'include 目标不存在或路径越界' },
    { re: /rbook-animation--error/g, why: 'animate 目标不存在、越界或不是 .animation.ts' },
    { re: /extra-link missing/g, why: 'rbook / 题目链接找不到目标' },
]
for (const { re, why } of MARKER_CHECKS) {
    const hits = body.match(re)
    if (hits && hits.length) push(why, hits.length, hits[0])
}

const errors = diag.filter(d => d.level === 'error')

console.log('=== ' + entryPath + ' ===')
console.log('正文 HTML 长度: ' + body.length + (showHtml ? '' : '（加 --html 打印正文）'))
if (showHtml) console.log(body)

if (found.length === 0) {
    console.log('✅ 没有发现方言残留')
}
else {
    console.log('⚠️ 可疑残留:')
    for (const f of found) {
        const at = f.line ? ' (第 ' + f.line + ' 行)' : ''
        console.log('  - [' + f.count + ' 处] ' + f.why + at)
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

process.exit(found.length === 0 && errors.length === 0 ? 0 : 1)
