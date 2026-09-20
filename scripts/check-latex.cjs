#!/usr/bin/env node
/**
 * check-latex.cjs — 扫描 book/ 下所有 Markdown 里的 LaTeX 公式，
 * 用 KaTeX 校验并报告**是哪个文件、哪一行**出问题。
 *
 * 为什么需要：KaTeX 的 strict 警告只走 console.warn，不带任何文件信息，
 * 构建时刷屏却无法定位。这个脚本在解析前就把公式与源位置绑定起来。
 *
 * 用法:
 *   node scripts/check-latex.cjs            # 只报告有问题的
 *   node scripts/check-latex.cjs --all      # 同时报告统计信息
 *   node scripts/check-latex.cjs --json     # 机器可读输出
 */
const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const BOOK = process.env.RBOOK_LATEX_SCAN_DIR
    ? path.resolve(process.env.RBOOK_LATEX_SCAN_DIR)
    : path.join(PROJECT_ROOT, 'book')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const katex = require(path.join(PROJECT_ROOT, 'node_modules', 'katex'))

const argv = process.argv.slice(2)
const AS_JSON = argv.includes('--json')
const SHOW_ALL = argv.includes('--all')

const KATEX_OPTIONS = {
    displayMode: true,
    throwOnError: false,
    strict: 'warn',
    macros: { '\\R': '\\mathbb{R}' },
}

function walkMd(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name)
        if (e.isDirectory()) walkMd(f, out)
        else if (e.name.endsWith('.md')) out.push(f)
    }
    return out
}

/**
 * 从 Markdown 源里抽取所有 LaTeX 公式，并记录其起始行号。
 * 支持 $$...$$（display）、\[...\]（display）、$...$（inline）。
 * 会跳过代码围栏内的内容。
 */
function extractFormulas(src) {
    const formulas = []
    const structureIssues = []
    const lines = src.split('\n')
    let inFence = false
    let fenceStart = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (/^\s*```/.test(line)) {
            if (!inFence) fenceStart = i + 1
            inFence = !inFence
            continue
        }
        if (inFence) continue

        // $$ ... $$ （可跨行）
        if (line.trim() === '$$') {
            const start = i + 1
            const buf = []
            i++
            while (i < lines.length && lines[i].trim() !== '$$') { buf.push(lines[i]); i++ }
            const tex = buf.join('\n')
            formulas.push({ tex, line: start, kind: '$$', display: true })
            // markdown-it-texmath 的块级正则不允许 $$ 内部再出现 $。
            // 一旦出现，它不报错、不抛异常，只把 $$ 当正文输出（静默丢内容）。
            if (tex.includes('$')) {
                structureIssues.push({
                    line: start,
                    message: '$$ 内部还出现了 $，texmath 的块级规则不会匹配，公式会被当成正文输出',
                    snippet: tex.trim().replace(/\s+/g, ' ').slice(0, 70),
                })
            }
            continue
        }

        // 同一行内的 $$...$$
        const inlineDollar = /\$\$([\s\S]+?)\$\$/g
        let m
        while ((m = inlineDollar.exec(line))) {
            formulas.push({ tex: m[1], line: i + 1, kind: '$$(inline)', display: true })
        }

        // \[ ... \] （可跨行）。
        // 注意：rbook 用 [[x]] 表示按键，所以 [[\[]] 里的 “\[” 不是公式起始。
        // 要求 \[ 后面不是 ‘]’（即 [[\[]] 与 [[\]]] 这类按键写法直接跳过）。
        const dispStart = /\\\[(?!\])/.exec(line)
        if (dispStart) {
            const start = i + 1
            let tex = line.slice(dispStart.index + 2)
            let closed = /\\\]/.test(tex)
            if (closed) tex = tex.slice(0, tex.search(/\\\]/))
            while (!closed && i + 1 < lines.length) {
                i++
                closed = /\\\]/.test(lines[i])
                tex += '\n' + (closed ? lines[i].slice(0, lines[i].search(/\\\]/)) : lines[i])
            }
            formulas.push({ tex, line: start, kind: '\\[\\]', display: true })
            continue
        }

        // $ ... $ 行内（跳过 \$ 转义与 $$ 已处理的情况）
        const inline = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g
        while ((m = inline.exec(line))) {
            formulas.push({ tex: m[1], line: i + 1, kind: '$', display: false })
        }
    }

    // 代码围栏未闭合会把后续正文/公式吞进代码块，同理属于静默丢内容。
    if (inFence) {
        structureIssues.push({
            line: fenceStart,
            message: '代码围栏 ``` 未闭合，其后内容会被当成代码块（公式不会渲染）',
            snippet: '',
        })
    }

    return { formulas, structureIssues }
}

/** 用 KaTeX 渲染一个公式，捕获 strict 警告与硬解析错误。 */
function checkFormula(tex, display) {
    const messages = []
    const origWarn = console.warn
    console.warn = (...args) => { messages.push(args.join(' ')) }
    try {
        const html = katex.renderToString(tex, { ...KATEX_OPTIONS, displayMode: display })
        // throwOnError:false 时 KaTeX 不抛异常，而是把错误渲染成 katex-error 节点，
        // 所以必须同时检查输出，否则会漏掉硬解析错误（如未转义的 & 或 <）。
        if (html.includes('katex-error')) {
            const m = /title="([^"]*)"/.exec(html)
            const detail = m ? unescapeHtml(m[1]) : 'KaTeX 解析失败'
            messages.push(detail.replace(/^ParseError:\s*KaTeX parse error:\s*/, ''))
        }
    }
    catch (err) {
        messages.push(`渲染抛出异常: ${err && err.message ? err.message : String(err)}`)
    }
    finally {
        console.warn = origWarn
    }
    return [...new Set(messages.map(cleanMessage))]
}

function unescapeHtml(s) {
    return String(s)
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
}

/** 去掉 KaTeX 的固定前缀与末尾 [ruleId]，只留可读描述。 */
function cleanMessage(raw) {
    return String(raw)
        .replace(/^LaTeX-incompatible input and strict mode is set to '(?:warn|error)':\s*/, '')
        .replace(/\s*\[[a-zA-Z]+\]\s*$/, '')
        .trim()
}

function main() {
    const files = walkMd(BOOK).sort()
    const problems = []
    let totalFormulas = 0

    for (const file of files) {
        const src = fs.readFileSync(file, 'utf8')
        const { formulas, structureIssues } = extractFormulas(src)
        for (const issue of structureIssues) {
            problems.push({
                file: path.relative(BOOK, file),
                line: issue.line,
                kind: '结构',
                messages: [issue.message],
                tex: issue.snippet,
            })
        }
        for (const f of formulas) {
            totalFormulas++
            const messages = checkFormula(f.tex, f.display)
            if (messages.length > 0) {
                problems.push({
                    file: path.relative(BOOK, file),
                    line: f.line,
                    kind: f.kind,
                    messages: [...new Set(messages)],
                    tex: f.tex.trim().split('\n').slice(0, 3).join(' / ').slice(0, 100),
                })
            }
        }
    }

    if (AS_JSON) {
        console.log(JSON.stringify({ totalFormulas, problemCount: problems.length, problems }, null, 2))
        process.exit(problems.length > 0 ? 1 : 0)
    }

    if (SHOW_ALL) {
        console.log(`扫描 ${files.length} 个 md 文件，${totalFormulas} 个公式`)
    }

    if (problems.length === 0) {
        console.log('✓ 未发现 LaTeX 问题')
        return
    }

    // 按文件聚合，便于定位
    const byFile = new Map()
    for (const p of problems) {
        if (!byFile.has(p.file)) byFile.set(p.file, [])
        byFile.get(p.file).push(p)
    }

    console.log(`✗ ${problems.length} 个公式有问题，涉及 ${byFile.size} 个文件\n`)
    for (const [file, list] of byFile) {
        console.log(`${file}`)
        for (const p of list) {
            console.log(`  L${p.line} (${p.kind})`)
            for (const m of p.messages) console.log(`      ${m}`)
            if (p.tex) console.log(`      > ${p.tex}`)
        }
        console.log('')
    }
    process.exit(1)
}

main()
