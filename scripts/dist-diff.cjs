#!/usr/bin/env node
/**
 * dist-diff.cjs — 比较两份 dist 清单，报告内容变化。
 *
 * 配合 scripts/dist-manifest.cjs 使用，用于内容迁移前后验证
 * "渲染结果是否改变"：
 *
 *   npx rbook build --profile full
 *   node scripts/dist-manifest.cjs dist .tsbuild/before.json
 *   # ... 做内容迁移 ...
 *   npx rbook build --profile full
 *   node scripts/dist-manifest.cjs dist .tsbuild/after.json
 *   node scripts/dist-diff.cjs .tsbuild/before.json .tsbuild/after.json
 *
 * 退出码: 0 = 无差异, 1 = 有差异, 2 = 用法错误
 */
const fs = require('fs')
const path = require('path')

function load(p) {
    const abs = path.resolve(process.cwd(), p)
    if (!fs.existsSync(abs)) {
        console.error(`清单文件不存在: ${p}`)
        process.exit(2)
    }
    return JSON.parse(fs.readFileSync(abs, 'utf8'))
}

function main() {
    const [beforePath, afterPath] = process.argv.slice(2)
    if (!beforePath || !afterPath) {
        console.error('用法: node scripts/dist-diff.cjs <before.json> <after.json>')
        process.exit(2)
    }

    const before = load(beforePath)
    const after = load(afterPath)

    const beforeFiles = before.files || {}
    const afterFiles = after.files || {}

    const added = []
    const removed = []
    const changed = []

    for (const [file, hash] of Object.entries(afterFiles)) {
        if (!(file in beforeFiles)) added.push(file)
        else if (beforeFiles[file] !== hash) changed.push(file)
    }
    for (const file of Object.keys(beforeFiles)) {
        if (!(file in afterFiles)) removed.push(file)
    }

    console.log(`before: ${before.count} 个 HTML  (${beforePath})`)
    console.log(`after : ${after.count} 个 HTML  (${afterPath})`)
    console.log('')

    const show = (label, list) => {
        if (list.length === 0) return
        console.log(`${label} (${list.length}):`)
        list.sort().forEach(f => console.log(`  ${f}`))
        console.log('')
    }

    show('新增页面', added)
    show('删除页面', removed)
    show('内容变化', changed)

    const total = added.length + removed.length + changed.length
    if (total === 0) {
        console.log('✓ 无差异：所有 HTML 的归一化内容完全一致')
        process.exit(0)
    }

    console.log(`✗ 共 ${total} 处差异 (新增 ${added.length} / 删除 ${removed.length} / 变化 ${changed.length})`)
    process.exit(1)
}

main()
