#!/usr/bin/env node
/**
 * migrate-ejs-macros.cjs — 把遗留 EJS 内容宏迁移到新语法。
 *
 * 迁移规则：
 *   fence 内：```cpp\n<%- include("./x.cpp") _%>\n```  ->  ```cpp file=./x.cpp\n```
 *   fence 外：<%- include("./x.md") %>                  ->  [[[include: ./x.md]]]
 *   pid_to_url(oj, id, title)                           -> [[[p: oj-id | title]]]
 *   [[[pp: oj-id]]] / [[[problem: ...]]]                -> [[[p: oj-id]]]
 *   video / iframe / dvideo / self_host / base_url      -> 见下方映射
 *
 * 用法:
 *   node scripts/migrate-ejs-macros.cjs --dry-run   # 只报告，不改文件
 *   node scripts/migrate-ejs-macros.cjs --apply     # 实际改写
 *   node scripts/migrate-ejs-macros.cjs --apply --only include
 */
const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const BOOK = path.join(PROJECT_ROOT, 'book')

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const ONLY = (() => {
    const i = argv.indexOf('--only')
    return i >= 0 ? argv[i + 1] : null
})()

/** 站点常量：与 src/publishing/integrations/problem-url.ts 保持一致 */
const RBOOK_BASE = process.env.RBOOK_SELF_BASE || 'https://rbook.roj.ac.cn'

function walkMd(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name)
        if (e.isDirectory()) walkMd(f, out)
        else if (e.name.endsWith('.md')) out.push(f)
    }
    return out
}

/** 迁移一个文件，返回 { changed, text, notes[] } */
function migrateFile(file, raw) {
    const notes = []
    const eol = raw.includes('\r\n') ? '\r\n' : '\n'
    let text = raw

    // ---- 1) fence 内 include -> file= 属性 ----
    if (!ONLY || ONLY === 'include') {
        text = migrateFenceIncludes(text, notes)
        // ---- 2) fence 外 include -> [[[include: ...]]] ----
        text = migrateInlineIncludes(text, notes)
    }

    // ---- 3) pid_to_url -> [[[p: oj-pid | title]]] ----
    if (!ONLY || ONLY === 'pid_to_url') {
        text = migratePidToUrl(text, notes)
    }

    // ---- 4) pp / problem_info_solution -> p ----
    if (!ONLY || ONLY === 'pp') {
        text = migratePp(text, notes)
    }

    // ---- 5) video / iframe / 站点变量 ----
    if (!ONLY || ONLY === 'media') {
        text = migrateMedia(text, notes)
    }

    return { changed: text !== raw, text: text.replace(/\r\n/g, eol), notes }
}

/** ```lang ... include("x") ... ``` -> ```lang file=x ``` */
function migrateFenceIncludes(text, notes) {
    const lines = text.split('\n')
    const out = []
    let fenceStart = -1 // out 中 fence 起始行的下标
    let body = []

    /** 把 body 原样写回（未迁移的 fence）。 */
    const emitBody = () => { for (const l of body) out.push(l) }

    const flush = () => {
        if (fenceStart < 0) return
        const incs = body.filter(l => /<%[-=]?\s*include\(/.test(l))
        if (incs.length === 0) { emitBody(); fenceStart = -1; body = []; return }

        const others = body.filter(l => !/<%[-=]?\s*include\(/.test(l)).filter(l => l.trim() !== '')
        if (others.length > 0) {
            notes.push(`SKIP fence@${fenceStart + 1}: fence 内除 include 外还有内容`)
            emitBody(); fenceStart = -1; body = []
            return
        }

        const targets = incs.map(l => {
            const m = /<%[-=]?\s*include\(\s*["']([^"']+)["']\s*\)\s*[-_]?%>/.exec(l)
            return m ? m[1] : null
        })
        if (targets.some(t => t === null)) {
            notes.push(`SKIP fence@${fenceStart + 1}: include 语法无法解析`)
            emitBody(); fenceStart = -1; body = []
            return
        }
        if (targets.length > 1) {
            notes.push(`SKIP fence@${fenceStart + 1}: 一个 fence 内有 ${targets.length} 个 include（需人工处理）`)
            emitBody(); fenceStart = -1; body = []
            return
        }

        // 把 file= 追加到 fence info，并丢弃 body（内容改由文件提供）
        const infoLine = out[fenceStart]
        const indent = /^(\s*)/.exec(infoLine)[1]
        const ticks = /^(\s*)(`{3,})/.exec(infoLine)
        const fence = ticks ? ticks[2] : '```'
        const info = infoLine.trim().slice(fence.length).trim()
        if (/\bfile\s*=/.test(info)) {
            notes.push(`SKIP fence@${fenceStart + 1}: info 已含 file=`)
            emitBody(); fenceStart = -1; body = []
            return
        }
        const newInfo = (info ? info + ' ' : '') + `file=${targets[0]}`
        out[fenceStart] = `${indent}${fence}${newInfo}`
        notes.push(`fence@${fenceStart + 1} -> file=${targets[0]}`)

        fenceStart = -1; body = []
    }

    for (const line of lines) {
        if (/^\s*```/.test(line)) {
            if (fenceStart < 0) { fenceStart = out.length; body = []; out.push(line) }
            else { flush(); out.push(line) }
            continue
        }
        if (fenceStart >= 0) { body.push(line); continue }
        out.push(line)
    }
    flush()
    return out.join('\n')
}

/** fence 外的 <%- include("x") %> -> [[[include: x]]] */
function migrateInlineIncludes(text, notes) {
    const lines = text.split('\n')
    const out = []
    let inFence = false
    for (const line of lines) {
        if (/^\s*```/.test(line)) { inFence = !inFence; out.push(line); continue }
        if (inFence) { out.push(line); continue }
        out.push(line.replace(
            /<%[-=]?\s*include\(\s*["']([^"']+)["']\s*\)\s*[-_]?%>/g,
            (_w, t) => { notes.push(`include -> [[[include: ${t}]]]`); return `[[[include: ${t}]]]` },
        ))
    }
    return out.join('\n')
}

/** pid_to_url("oj","id","title") -> [[[p: oj-id | title]]] */
function migratePidToUrl(text, notes) {
    return text.replace(
        /<%[-=]?\s*pid_to_url\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']*)["']\s*\)\s*[-_]?%>/g,
        (_w, oj, id, title) => {
            notes.push(`pid_to_url(${oj},${id}) -> [[[p: ${oj}-${id} | ${title}]]]`)
            return `[[[p: ${oj}-${id} | ${title}]]]`
        },
    )
}

/** [[[pp: x]]] / [[[problem: x]]] / [[[problem_info_solution: x]]] -> [[[p: x]]] */
function migratePp(text, notes) {
    return text.replace(
        /\[\[\[\s*(pp|problem|problem_info_solution)\s*:\s*([^\]]+?)\s*\]\]\]/g,
        (_w, type, body) => {
            if (type === 'problem') return _w // problem 与 p 同义，保留
            notes.push(`[[[${type}: ${body}]]] -> [[[p: ${body}]]]`)
            return `[[[p: ${body}]]]`
        },
    )
}

/**
 * video/iframe 等媒体宏 -> 原生 HTML（Markdown 允许内联 HTML）。
 * 保持与 content-macros.ts 的 createDefaultHelpers 完全相同的输出。
 */
function migrateMedia(text, notes) {
    let out = text

    // video("x.mp4") -> <video ...>
    out = out.replace(
        /<%[-=]?\s*video\(\s*["']([^"']+)["']\s*\)\s*[-_]?%>/g,
        (_w, src) => {
            const f = src.endsWith('.mp4') ? src : `${src}.mp4`
            notes.push(`video(${src}) -> <video>`)
            return `<video width="800" loop controls autoplay src="/video/${f}" type="video/mp4">Your browser does not support the video tag. </video>`
        },
    )

    // dvideo("x.mp4") -> <video ... d.roj.ac.cn>
    out = out.replace(
        /<%[-=]?\s*dvideo\(\s*["']([^"']+)["']\s*\)\s*[-_]?%>/g,
        (_w, src) => {
            const f = src.endsWith('.mp4') ? src : `${src}.mp4`
            notes.push(`dvideo(${src}) -> <video>`)
            return `<video width="800" loop controls autoplay src="https://d.roj.ac.cn/d/RainboyVideo/${f}" type="video/mp4">Your browser does not support the video tag. </video>`
        },
    )

    // iframe(src[, height]) -> <div class="iframe-container">...
    out = out.replace(
        /<%[-=]?\s*iframe\(\s*["']([^"']+)["']\s*(?:,\s*(\d+)\s*)?\)\s*[-_]?%>/g,
        (_w, src, h) => {
            const height = h || '800'
            notes.push(`iframe(${src}) -> <div class="iframe-container">`)
            return `<div class="iframe-container">\n<a href="${src}" target="_blank">新标签打开</a>\n<iframe height="${height}" frameborder="1" src="${src}"></iframe>\n</div>\n`
        },
    )

    // <%= self_host %> / <%= base_url %> -> 站点绝对地址
    out = out.replace(/<%=\s*self_host\s*[-_]?%>/g, () => {
        notes.push('self_host -> 站点绝对地址')
        return `${RBOOK_BASE}/`
    })
    out = out.replace(/<%=\s*base_url\s*[-_]?%>/g, () => {
        notes.push('base_url -> 站点绝对地址')
        return RBOOK_BASE
    })

    return out
}

function main() {
    const files = walkMd(BOOK)
    let changedFiles = 0
    let totalNotes = 0
    const skipped = []

    for (const file of files) {
        const raw = fs.readFileSync(file, 'utf8')
        const { changed, text, notes } = migrateFile(file, raw)
        for (const n of notes) if (n.startsWith('SKIP')) skipped.push(`${path.relative(BOOK, file)}: ${n}`)

        if (changed) {
            changedFiles++
            totalNotes += notes.length
            if (APPLY) fs.writeFileSync(file, text, 'utf8')
        }
    }

    console.log(`${APPLY ? '已改写' : '将改写'} 文件数: ${changedFiles} / ${files.length}`)
    console.log(`迁移点: ${totalNotes}`)
    if (skipped.length) {
        console.log(`\n跳过 (需人工处理) ${skipped.length} 处:`)
        skipped.forEach(s => console.log(`  ${s}`))
    }
    if (!APPLY) console.log('\n（未写盘；加 --apply 实际执行）')
}

main()
