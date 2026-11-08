#!/usr/bin/env node
/**
 * 一次性迁移：把 book/<文章>/config.yaml 的构建字段搬进该文 md 的 front matter。
 *
 * 用法：node scripts/migrate-config-to-frontmatter.cjs [--dry]
 *
 * 产物形态：
 *
 *   ---
 *   title: 前缀和            # 正文标题（顶层）
 *   menu_title: presum       # 菜单短名（顶层，可选）
 *   rbook:                   # 其余构建字段
 *     id: presum
 *     pre: [差分]
 *     code_template: [...]
 *   ---
 *
 * 迁移后 config.yaml 全部删除；`file:` 字段直接丢弃，因为一份配置只描述它自己
 * 所在的那个 md 文件，不再需要声明「哪一个是文章入口」。
 */
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const BOOK = path.join(PROJECT_ROOT, 'book')
const DRY = process.argv.includes('--dry')

const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalogLeaves } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))

const CONFIG_NAMES = ['config.yaml', 'config.yml', 'config.json', 'config.jsonc']
const TOP_LEVEL_ONLY = new Set(['title', 'menu_title'])
const DROP = new Set(['file'])

function findConfig(dir) {
    for (const name of CONFIG_NAMES) {
        const p = path.join(dir, name)
        if (fs.existsSync(p)) return p
    }
    return null
}

function readConfig(file) {
    const raw = fs.readFileSync(file, 'utf8')
    if (/\.jsonc?$/.test(file)) {
        const { parse } = require('jsonc-parser')
        const errors = []
        const data = parse(raw, errors, { allowTrailingComma: true })
        if (errors.length) throw new Error(`JSONC 解析失败: ${file}`)
        return data || {}
    }
    return yaml.load(raw) || {}
}

function splitFrontMatter(raw) {
    const text = raw.replace(/^\uFEFF/, '')
    const lines = text.split('\n')
    if (lines[0] === undefined || lines[0].trim() !== '---') return { data: {}, body: text, had: false }
    let end = -1
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') { end = i; break }
    }
    if (end < 0) return { data: {}, body: text, had: false }
    const data = yaml.load(lines.slice(1, end).join('\n')) || {}
    return { data, body: lines.slice(end + 1).join('\n'), had: true }
}

function dumpFrontMatter(merged) {
    // title / menu_title 放最前，rbook 放最后，便于人读
    const ordered = {}
    if (merged.title) ordered.title = merged.title
    if (merged.menu_title) ordered.menu_title = merged.menu_title
    for (const [k, v] of Object.entries(merged)) {
        if (k === 'title' || k === 'menu_title' || k === 'rbook') continue
        ordered[k] = v
    }
    if (merged.rbook && Object.keys(merged.rbook).length > 0) ordered.rbook = merged.rbook
    return yaml.dump(ordered, { lineWidth: -1, noRefs: true, sortKeys: false })
}

const leaves = flattenCatalogLeaves(loadCatalog(path.join(BOOK, 'catalog.yaml'), []))
const report = { migrated: [], noConfig: [], conflicts: [], leftovers: [] }
const usedConfigs = new Set()

for (const leaf of leaves) {
    const entryPath = path.join(BOOK, leaf.path)
    const isDir = fs.statSync(entryPath).isDirectory()
    const dir = isDir ? entryPath : path.dirname(entryPath)
    const configFile = findConfig(dir)
    const config = configFile ? readConfig(configFile) : {}

    // 老规则：目录叶子的入口是 config.file（默认 index.md）；.md 叶子就是它自己，
    // 且只有当同目录 config 声明的是它时才生效。
    let mdPath
    let configApplies
    if (isDir) {
        mdPath = path.join(entryPath, String(config.file || 'index.md'))
        configApplies = Boolean(configFile)
    }
    else {
        mdPath = entryPath
        const declared = config.file ? path.join(dir, String(config.file)) : path.join(dir, 'index.md')
        configApplies = Boolean(configFile) && path.normalize(declared) === path.normalize(mdPath)
    }
    if (!fs.existsSync(mdPath)) throw new Error(`找不到文章文件: ${mdPath}`)

    const raw = fs.readFileSync(mdPath, 'utf8')
    const fm = splitFrontMatter(raw)
    const effectiveConfig = configApplies ? config : {}

    const configTitle = String(effectiveConfig.title || '').trim()
    const fmTitle = String(fm.data.title || '').trim()
    const title = configTitle || fmTitle || leaf.title
    if (configTitle && fmTitle && configTitle !== fmTitle) {
        report.conflicts.push({ file: path.relative(BOOK, mdPath), configTitle, fmTitle })
    }

    const rbook = {}
    for (const [k, v] of Object.entries(effectiveConfig)) {
        if (TOP_LEVEL_ONLY.has(k) || DROP.has(k)) continue
        rbook[k] = v
    }

    const next = splitFrontMatter(raw)
    const data = { ...next.data, title }
    const menuTitle = String(effectiveConfig.menu_title || '').trim()
    if (menuTitle) data.menu_title = menuTitle
    else delete data.menu_title
    if (Object.keys(rbook).length > 0) data.rbook = rbook
    else delete data.rbook
    delete data.file

    const out = `---\n${dumpFrontMatter(data)}---\n${next.body.replace(/^\n+/, '\n')}`
    if (!DRY) fs.writeFileSync(mdPath, out, 'utf8')

    if (configApplies && configFile) {
        usedConfigs.add(configFile)
        report.migrated.push({ file: path.relative(BOOK, mdPath), fields: Object.keys(rbook) })
    }
    else {
        report.noConfig.push(path.relative(BOOK, mdPath))
    }
}

// 没有被任何叶子用到的 config：说明目录里有配置却没有散文挂目录
if (!DRY) {
    for (const dirName of fs.readdirSync(BOOK, { recursive: true })) {
        const full = path.join(BOOK, dirName)
        if (!fs.existsSync(full) || !fs.statSync(full).isDirectory()) continue
        const cfg = findConfig(full)
        if (cfg && !usedConfigs.has(cfg)) report.leftovers.push(path.relative(BOOK, cfg))
    }
}

// 删除所有已迁移的 config 文件
if (!DRY) {
    for (const cfg of usedConfigs) fs.unlinkSync(cfg)
}

console.log(`迁移 ${report.migrated.length} 篇，无 config ${report.noConfig.length} 篇，删除 config ${usedConfigs.size} 个`)
if (report.conflicts.length) {
    console.log(`\n标题冲突（已采用 config.title）: ${report.conflicts.length}`)
    for (const c of report.conflicts) console.log(`  ${c.file}: config=${JSON.stringify(c.configTitle)} frontmatter=${JSON.stringify(c.fmTitle)}`)
}
if (report.leftovers.length) {
    console.log(`\n没有被迁移的 config（目录里没有对应的目录叶子）: ${report.leftovers.length}`)
    for (const l of report.leftovers) console.log(`  ${l}`)
}
if (report.noConfig.length) {
    console.log(`\n没有 config、本来就只靠 front matter 的文章: ${report.noConfig.length}`)
}
