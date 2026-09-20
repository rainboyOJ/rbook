/**
 * check-catalog.js — `npm run check:catalog` 入口
 *
 * 1. 验证 catalog.yaml 的所有条目可解析，报告配置错误。
 * 2. 孤儿检测：book/ 下的 .md 若无法从 catalog 到达（含 include / teach_plan），
 *    说明它写了却永远不会被发布 —— 必须显式登记到 orphan-allowlist 里。
 *    新增孤儿会让校验失败，避免再出现「写了但没挂上菜单」的内容。
 *
 * 非零退出 = 有错误。
 *
 * 重新生成 allowlist：node tests/check-catalog.js --update-orphans
 */
const fs = require('fs')
const path = require('path')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
const { normalizeMetadata } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/metadata-normalizer.js'))
const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))
const { formatDiagnostic } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/diagnostics.js'))

const catalogPath = path.join(PROJECT_ROOT, 'book', 'catalog.yaml')
const allowlistPath = path.join(__dirname, 'orphan-allowlist.json')
const policy = new PathPolicy(PROJECT_ROOT)
const diag = []

/**
 * 辅助文件：它们是被正文 include 或工具链引用的素材，本身不是文章，
 * 缺席时不算「漏挂菜单」。匹配文件名（不含路径）。
 */
const AUXILIARY_FILE_RE = /^(teach_plan|teach_plain|TODO|todo|bak|old|index_old|history|log|reference|summary|model|proof|practice|problem|problem_list|\d+)\.md$/i

const INCLUDE_RE = /\[\[\[\s*include\s*:\s*([^\]]+?)\s*\]\]\]/g
const LEGACY_INCLUDE_RE = /<%[-=]?\s*include\(\s*["']([^"']+)["']\s*\)\s*[-_]?%>/g
const FENCE_FILE_RE = /(?:^|\s)file\s*=\s*(?:"([^"]+)"|'([^']+)'|(\S+))/g

function walkMd(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walkMd(full, out)
        else if (entry.name.endsWith('.md')) out.push(full)
    }
    return out
}

/** 展开 include：```lang file=x ```、[[[include: x]]]、遗留 EJS include，以及 teach_plan。 */
function expandReachable(seed) {
    const reachable = new Set(seed.map(p => path.resolve(p)))
    let changed = true
    let guard = 0
    while (changed && guard++ < 32) {
        changed = false
        for (const file of [...reachable]) {
            if (!file.endsWith('.md')) continue
            const dir = path.dirname(file)
            let src
            try { src = fs.readFileSync(file, 'utf8') } catch { continue }

            const targets = []
            for (const re of [INCLUDE_RE, LEGACY_INCLUDE_RE]) {
                re.lastIndex = 0
                let m
                while ((m = re.exec(src))) {
                    // include 目标可能带 `| 标题` 之类的后缀，取 `|` 之前
                    targets.push(m[1].split('|')[0].trim())
                }
            }
            // 代码围栏的 file= 属性
            for (const line of src.split('\n')) {
                if (!/^\s*```/.test(line)) continue
                FENCE_FILE_RE.lastIndex = 0
                const m = FENCE_FILE_RE.exec(line)
                if (m) targets.push(m[1] || m[2] || m[3])
            }
            // teach_plan 元数据
            try {
                const meta = normalizeMetadata({}, file, [])
                if (meta.teachPlan) targets.push(meta.teachPlan)
            }
            catch { /* 忽略元数据解析失败 */ }

            for (const t of targets) {
                if (!t) continue
                const abs = path.resolve(dir, t)
                if (!reachable.has(abs)) { reachable.add(abs); changed = true }
            }
        }
    }
    return reachable
}

function computeOrphans() {
    const catalog = loadCatalog(catalogPath, diag)
    const leaves = flattenCatalog(catalog)
    console.log(`catalog 条目数: ${catalog.entries.length}`)
    console.log(`叶子文章数: ${leaves.length}`)

    const seeds = []
    for (const leaf of leaves) {
        try {
            seeds.push(resolveArticleSource(leaf, policy.book, diag).source.filePath)
        }
        catch (e) {
            diag.push({ phase: 'catalog-validate', level: 'error', message: `${leaf}: ${e.message}` })
        }
    }

    const reachable = expandReachable(seeds)
    const all = walkMd(policy.book)
    const orphans = all
        .filter(f => !reachable.has(path.resolve(f)))
        .map(f => path.relative(policy.book, f).split(path.sep).join('/'))
        .sort()
    return { orphans, articleCount: leaves.length }
}

function readAllowlist() {
    if (!fs.existsSync(allowlistPath)) return { allowed: [] }
    try { return JSON.parse(fs.readFileSync(allowlistPath, 'utf8')) }
    catch (e) { throw new Error(`orphan-allowlist.json 解析失败: ${e.message}`) }
}

function main() {
    const update = process.argv.includes('--update-orphans')
    const { orphans } = computeOrphans()

    const auxiliary = orphans.filter(o => AUXILIARY_FILE_RE.test(path.basename(o)))
    const realOrphans = orphans.filter(o => !AUXILIARY_FILE_RE.test(path.basename(o)))

    if (update) {
        const payload = {
            note: '这些 md 从 catalog 无法到达（也没被 include / teach_plan 引用），因此不会发布。请逐项确认：应当移除、挂进 catalog，还是继续保留。',
            allowed: realOrphans,
        }
        fs.writeFileSync(allowlistPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
        console.log(`\n已写入 ${path.relative(PROJECT_ROOT, allowlistPath)}（${realOrphans.length} 项）`)
        console.log(`辅助文件（自动忽略 ${auxiliary.length} 个）: ${[...new Set(auxiliary.map(a => path.basename(a)))].sort().join(', ')}`)
        return
    }

    const { allowed } = readAllowlist()
    const allowedSet = new Set(allowed)
    const newcomers = realOrphans.filter(o => !allowedSet.has(o))
    const stale = allowed.filter(o => !realOrphans.includes(o))

    console.log(`孤儿 md: ${orphans.length}（辅助文件 ${auxiliary.length} + 待确认 ${realOrphans.length}）`)

    if (stale.length > 0) {
        console.log(`\n提示: allowlist 中 ${stale.length} 项已不再是孤儿，可以从 orphan-allowlist.json 删除:`)
        stale.forEach(s => console.log(`  - ${s}`))
    }

    if (newcomers.length > 0) {
        diag.push({
            phase: 'orphan-check',
            level: 'error',
            message: `发现 ${newcomers.length} 个新的孤儿 md（写了但不会发布）: ${newcomers.slice(0, 5).join(', ')}${newcomers.length > 5 ? ' …' : ''}`,
            suggestion: '把它们挂进 catalog，或经确认后运行 node tests/check-catalog.js --update-orphans 登记',
        })
    }

    const errors = diag.filter(d => d.level === 'error')
    const warnings = diag.filter(d => d.level === 'warning')

    if (warnings.length > 0) {
        console.log(`\n警告 (${warnings.length}):`)
        warnings.forEach(w => console.log(`  ${formatDiagnostic(w)}`))
    }
    if (errors.length > 0) {
        console.log(`\n错误 (${errors.length}):`)
        errors.forEach(e => console.log(`  ${formatDiagnostic(e)}`))
        process.exit(1)
    }
    console.log('\n✓ catalog 验证通过')
}

try {
    main()
}
catch (e) {
    console.error(`致命错误: ${e.message}`)
    process.exit(1)
}
