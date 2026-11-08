#!/usr/bin/env node
/**
 * 一次性迁移：把旧的四套容器改成 `::: kind [标题]`。
 *
 *   node scripts/migrate-box-containers.cjs --dry-run   # 只看清单
 *   node scripts/migrate-box-containers.cjs             # 真改
 *
 * 规则见 docs/adr/0014-typed-boxes.md：
 * - oneWordAlgo → algorithm，warning → warn，info → note，error → warn（0 处）
 * - colorfulbox 的第一段原本被 CSS 当作标题，现在把标题搬进语法；正文文字不动
 * - 判断不了的一律列进复核清单，脚本只保证「旧名字消失、内容不丢」
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const BOOK = path.join(ROOT, 'book')
const DRY = process.argv.includes('--dry-run')

const OLD_NAMES = /^:::\s*(colorfulbox|oneWordAlgo|onewordalgo|warning|info|error|blackboard)\b\s*(.*)$/

const KEYWORD_KIND = {
    定义: 'definition',
    定理: 'theorem',
    引理: 'lemma',
    推论: 'corollary',
    证明: 'proof',
    例: 'example',
    例题: 'example',
    总结: 'summary',
}
// 这些不是方框类型，只是作者的写法习惯：保留成 label，不新开 kind。
const KEYWORD_LABEL = ['口诀', '引入', '核心思想', '核心', '性质', '重要性质', '结论', '注意', '说明']

const KEYWORD_RE = new RegExp(`^(${Object.keys(KEYWORD_KIND).concat(KEYWORD_LABEL).join('|')})(.*)$`)
const BODY_FIRST_RE = /^(?:!\[|\$\$|```|\||<)/
const LOOKS_LIKE_SENTENCE = /[。！？]$/

const report = { rewrite: [], review: [], manual: [] }

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (entry.name.endsWith('.md')) out.push(full)
    }
    return out
}

function closeIndex(lines, start) {
    for (let i = start + 1; i < lines.length; i++) {
        if (/^:::\s*$/.test(lines[i])) return i
    }
    return -1
}

function firstContent(lines, from, to) {
    for (let i = from; i < to; i++) {
        if (lines[i].trim()) return i
    }
    return -1
}

/** 把「定理$2$: 一维四边形不等式…」切成 kind 与标题。 */
function splitLabel(line) {
    const text = line.trim()
    const m = KEYWORD_RE.exec(text)
    if (!m) return null
    const keyword = m[1]
    let rest = m[2].trim()

    // 编号：`$1$` / `1` / `1.2` 这类紧贴关键词的记号，保留在标题里
    let number = ''
    const numMatch = /^([$0-9.{}^_a-zA-Z\\]+?)\s*[:：]\s*/.exec(rest)
    if (numMatch) {
        number = numMatch[1]
        rest = rest.slice(numMatch[0].length).trim()
    }
    else {
        rest = rest.replace(/^[:：]\s*/, '').trim()
    }

    const kind = KEYWORD_KIND[keyword] || 'note'
    const label = KEYWORD_KIND[keyword] ? undefined : keyword
    const title = number ? `${number}: ${rest}`.trim() : rest
    return { kind, label, title }
}

function migrate(text, file) {
    const lines = text.split('\n')
    const out = []
    let changed = false

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const m = OLD_NAMES.exec(line)
        if (!m) {
            out.push(line)
            continue
        }
        const name = m[1].toLowerCase()
        const trailing = m[2] ? m[2].trim() : ''
        const end = closeIndex(lines, i)
        if (end === -1) {
            report.manual.push({ file, line: i + 1, why: '找不到收尾的 :::', text: line })
            out.push(line)
            continue
        }

        const where = `${path.relative(ROOT, file)}:${i + 1}`

        if (name === 'blackboard') {
            report.manual.push({ file, line: i + 1, why: 'blackboard 只被使用过 0 次，需要人工决定去处', text: line })
            out.push(line)
            continue
        }

        if (name !== 'colorfulbox') {
            const kind = name === 'onewordalgo' ? 'algorithm' : name === 'warning' || name === 'error' ? 'warn' : 'note'
            out.push(`::: ${kind}${trailing ? ` ${trailing}` : ''}`.trimEnd())
            report.rewrite.push({ where, from: name, to: kind })
            changed = true
            continue
        }

        // colorfulbox：第一段原本靠 CSS 当标题
        const first = firstContent(lines, i + 1, end)
        if (first === -1) {
            out.push('::: note')
            report.review.push({ where, kind: 'note', title: '', why: '空盒子' })
            changed = true
            continue
        }

        const firstLine = lines[first].trim()

        if (BODY_FIRST_RE.test(firstLine)) {
            out.push('::: note')
            report.review.push({ where, kind: 'note', title: '', why: `首节点不是文字（${firstLine.slice(0, 20)}），按中性盒子处理` })
            changed = true
            continue
        }

        const split = splitLabel(firstLine)
        if (split) {
            const parts = [`::: ${split.kind}`]
            if (split.title) parts.push(split.title)
            if (split.label) parts.push(`label=${split.label}`)
            out.push(parts.join(' '))
            report.rewrite.push({ where, from: 'colorfulbox', to: split.kind, title: split.title })
            changed = true
            // 标题搬走后 opener 与正文之间只留一个空行
            while (out.length && out[out.length - 1].trim() === '') out.pop()
            out.push('')
            for (let k = i + 1; k <= first; k++) {
                if (k === first) continue
                if (lines[k].trim() === '' && out[out.length - 1].trim() === '') continue
                out.push(lines[k])
            }
            i = first
            continue
        }

        // 没有关键词：短的一行当标题，整句留在正文。
        // 「整除的定义」这类以「的定义」结尾的按 definition 处理。
        const bare = firstLine.replace(/[:：]\s*$/, '').trim()
        const guessKind = /的定义$/.test(bare) ? 'definition' : 'theorem'
        if (bare.length <= 20 && !LOOKS_LIKE_SENTENCE.test(bare) && !/[，,；;]/.test(bare)) {
            out.push(`::: ${guessKind} ${bare}`)
            report.review.push({ where, kind: guessKind, title: bare, why: '没有关键词，脚本猜了 kind 与标题' })
            changed = true
            // 标题搬走后 opener 与正文之间只留一个空行
            while (out.length && out[out.length - 1].trim() === '') out.pop()
            out.push('')
            for (let k = i + 1; k <= first; k++) {
                if (k === first) continue
                if (lines[k].trim() === '' && out[out.length - 1].trim() === '') continue
                out.push(lines[k])
            }
            i = first
            continue
        }

        out.push('::: theorem')
        report.review.push({ where, kind: 'theorem', title: '', why: `首段是完整句子（${firstLine.slice(0, 24)}…），留在正文` })
        changed = true
    }

    return { text: changed ? out.join('\n') : null, changed }
}

const files = walk(BOOK)
let touched = 0
for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8')
    const { text, changed } = migrate(raw, file)
    if (!changed) continue
    touched++
    if (!DRY) fs.writeFileSync(file, text)
}

console.log(`${DRY ? '[dry-run] ' : ''}改写文件数: ${touched}`)
console.log(`容器名替换: ${report.rewrite.length}  需复核: ${report.review.length}  无法处理: ${report.manual.length}`)

const byKind = {}
for (const r of report.rewrite) byKind[`${r.from} → ${r.to}`] = (byKind[`${r.from} → ${r.to}`] || 0) + 1
console.log('\n## 容器名替换')
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${v.toString().padStart(3)}  ${k}`)

if (report.review.length) {
    console.log('\n## 复核清单（colorfulbox 的标题判断）')
    for (const r of report.review) console.log(`  ${r.where}\n      kind=${r.kind}  title=${r.title || '(无)'}\n      ${r.why}`)
}
if (report.manual.length) {
    console.log('\n## 无法处理')
    for (const r of report.manual) console.log(`  ${path.relative(ROOT, r.file)}:${r.line}  ${r.why}\n      ${r.text}`)
}
