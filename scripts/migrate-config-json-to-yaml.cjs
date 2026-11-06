#!/usr/bin/env node
/**
 * migrate-config-json-to-yaml.cjs — 把文章目录里的 config.json 迁移成 config.yaml。
 *
 * 背景：一个文章目录的元信息只应有一种格式。加载器（src/publishing/content/
 * config-loader.ts）按 config.json -> config.jsonc -> config.yaml -> config.yml
 * 的优先级查找，两种格式同时存在时 json 会遮蔽 yaml，所以迁移必须删掉旧的 json。
 *
 * 迁移规则：
 *   - 只处理 book/ 下存在 config.json 的目录；目录里已有 config.yaml/yml 时跳过并告警。
 *   - 用 jsonc-parser 解析，容忍 // 注释与尾逗号（74 个旧文件里有 11 个不是严格 JSON）。
 *   - 键顺序统一为 id -> title -> file -> 其余键（其余键保持原文件顺序）。
 *   - 注释不参与自动搬运：脚本会列出含注释的文件，注释由人工按 YAML 的 `#` 补回。
 *   - YAML 由 js-yaml dump：indent 2、不折行、不生成锚点。
 *   - --delete-json 只在「新 yaml 读回来的数据与旧 json 深比较一致」时删旧文件，
 *     任何字段丢失都会中止，避免静默改内容。
 *
 * 用法:
 *   node scripts/migrate-config-json-to-yaml.cjs --dry-run
 *   node scripts/migrate-config-json-to-yaml.cjs --apply
 *   node scripts/migrate-config-json-to-yaml.cjs --apply --delete-json
 */
const fs = require('fs')
const path = require('path')
const { isDeepStrictEqual } = require('util')
const { parse: jsoncParse } = require('jsonc-parser')
const yaml = require('js-yaml')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const BOOK = path.join(PROJECT_ROOT, 'book')

const argv = process.argv.slice(2)
const APPLY = argv.includes('--apply')
const DELETE_JSON = argv.includes('--delete-json')

/** YAML 里希望排在最前面的键，与既有 config.yaml 的写法保持一致。 */
const KEY_ORDER = ['id', 'title', 'file']

function walkConfigDirs(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walkConfigDirs(full, out)
        else if (entry.name === 'config.json') out.push(dir)
    }
    return out
}

function reorderKeys(data) {
    const ordered = {}
    for (const key of KEY_ORDER) {
        if (Object.prototype.hasOwnProperty.call(data, key)) ordered[key] = data[key]
    }
    for (const key of Object.keys(data)) {
        if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = data[key]
    }
    return ordered
}

function dumpYaml(data) {
    return yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
        quotingType: '"',
        forceQuotes: false,
    })
}

/**
 * 找出整行 // 注释，仅用于报告，不参与转换。
 * jsonc-parser 的 parseTree 不把 comment 作为节点返回，所以这里按行扫；
 * 这批文件里的注释都是整行注释，没有行尾注释（URL 里的 // 不会被误判）。
 */
function collectComments(raw) {
    return raw.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.startsWith('//'))
}

function main() {
    const dirs = walkConfigDirs(BOOK).sort()
    if (dirs.length === 0) {
        console.log('没有找到需要迁移的 config.json')
        return
    }

    const report = { converted: [], skipped: [], failed: [], withComments: [] }

    for (const dir of dirs) {
        const rel = path.relative(PROJECT_ROOT, dir)
        const jsonPath = path.join(dir, 'config.json')
        const yamlPath = path.join(dir, 'config.yaml')
        const ymlPath = path.join(dir, 'config.yml')

        if (fs.existsSync(yamlPath) || fs.existsSync(ymlPath)) {
            report.skipped.push(`${rel}（目录里已有 YAML，json 会遮蔽它，需人工处理）`)
            continue
        }

        const raw = fs.readFileSync(jsonPath, 'utf8')
        const errors = []
        const data = jsoncParse(raw, errors, { allowTrailingComma: true })

        if (typeof data !== 'object' || data === null || Array.isArray(data)) {
            report.failed.push(`${rel}（config.json 顶层不是对象）`)
            continue
        }

        const comments = collectComments(raw)
        if (comments.length > 0) report.withComments.push({ rel, count: comments.length })

        const text = dumpYaml(reorderKeys(data))

        if (!APPLY) {
            report.converted.push(rel)
            continue
        }

        fs.writeFileSync(yamlPath, text, 'utf8')

        // 写完立刻读回校验：YAML 解释器的隐式类型（yes/no/2.0/八进制…）可能改变值。
        const reloaded = yaml.load(text)
        if (!isDeepStrictEqual(reloaded, data)) {
            report.failed.push(`${rel}（YAML 读回与 JSON 深比较不一致，已保留 config.json）`)
            continue
        }

        if (DELETE_JSON) fs.unlinkSync(jsonPath)
        report.converted.push(rel)
    }

    console.log(`扫描到 ${dirs.length} 个 config.json`)
    console.log(`转换 ${report.converted.length} 个${APPLY ? '' : '（dry-run，未落盘）'}`)
    if (report.converted.length > 0 && report.converted.length <= 20) {
        for (const rel of report.converted) console.log(`  - ${rel}`)
    }
    if (report.withComments.length > 0) {
        console.log(`\n含 // 注释、需要人工按 YAML 补回的文件 ${report.withComments.length} 个：`)
        for (const { rel, count } of report.withComments) console.log(`  - ${rel}（${count} 处）`)
    }
    if (report.skipped.length > 0) {
        console.log(`\n跳过 ${report.skipped.length} 个：`)
        for (const rel of report.skipped) console.log(`  - ${rel}`)
    }
    if (report.failed.length > 0) {
        console.log(`\n失败 ${report.failed.length} 个：`)
        for (const rel of report.failed) console.log(`  - ${rel}`)
        process.exitCode = 1
    }
}

main()
