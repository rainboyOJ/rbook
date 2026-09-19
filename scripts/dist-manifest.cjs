#!/usr/bin/env node
/**
 * dist-manifest.cjs — 为 dist/ 下的 HTML 产物生成可比较的清单。
 *
 * 用途：内容迁移（例如把 EJS 内容宏换成新语法）前后，用它判断
 * "渲染结果是否真的没变"。清单对每个 HTML 取归一化后的 sha256，
 * 归一化会剔除访问计数徽章、绝对路径、日期等动态噪声。
 *
 * 用法:
 *   node scripts/dist-manifest.cjs [dist目录] [输出文件]
 * 默认:
 *   dist -> .tsbuild/dist-manifest.json
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const { normalizeSnapshot } = require('../tests/helpers/snapshot-normalizer.js')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const distDir = path.resolve(PROJECT_ROOT, process.argv[2] || 'dist')
const outFile = path.resolve(PROJECT_ROOT, process.argv[3] || '.tsbuild/dist-manifest.json')

function walkHtml(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walkHtml(full, out)
        else if (entry.name.endsWith('.html')) out.push(full)
    }
    return out
}

function main() {
    if (!fs.existsSync(distDir)) {
        console.error(`dist 目录不存在: ${distDir}`)
        console.error('请先运行构建: npx rbook build --profile full')
        process.exit(1)
    }

    const files = walkHtml(distDir).sort()
    const manifest = {
        distDir: path.relative(PROJECT_ROOT, distDir) || '.',
        count: files.length,
        files: {},
    }

    for (const file of files) {
        const rel = path.relative(distDir, file).split(path.sep).join('/')
        const raw = fs.readFileSync(file, 'utf8')
        const normalized = normalizeSnapshot(raw)
        manifest.files[rel] = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16)
    }

    fs.mkdirSync(path.dirname(outFile), { recursive: true })
    fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

    console.log(`已写入清单: ${path.relative(PROJECT_ROOT, outFile)}`)
    console.log(`HTML 文件数: ${manifest.count}`)
}

main()
