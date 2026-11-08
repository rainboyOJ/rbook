/**
 * check-catalog.js — `npm run check:catalog` 入口
 *
 * 1. 验证 catalog.yaml 的所有条目可解析，报告配置错误。
 * 2. 孤儿检测：book/ 下的 .md 若无法从 catalog 到达（含 include / teach_plan），
 *    说明它写了却永远不会被发布 —— 必须显式登记到 orphan-allowlist 里，
 *    并且**写明为什么不发布**（reason），否则校验失败。
 * 3. 标题巡检：既没有 config.title、md 里也没有 H1 的文章，页面标题和
 *    dist/catalog.json 只能用 catalog 导航名冒充，列出来等作者补标题。
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
const { readFrontMatter } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/front-matter.js'))
const { titleNeedsAuthoring, frontMatterTitle, menuTitleWidth, MENU_TITLE_MAX_WIDTH } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/article-title.js'))

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
            // teach_plan 元数据（在 front matter 的 rbook: 子键里）
            try {
                const meta = normalizeMetadata(readFrontMatter(src, file).data, file, [])
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

/**
 * 孤儿按「为什么没发布」分类。分类不是装饰：它决定 allowlist 里能写哪个 reason。
 *
 * - identity  front matter 里有 rbook.id，说明是有意发布却还没挂进 catalog（P0 债务）
 * - draft     front matter 里标了 status/state: TODO/draft
 * - triage    其余：既没声明自己是文章，也没标草稿，等人判断
 *
 * `aux`（素材）只保留给历史条目：config.yaml 时代还能用「目录 config 声明的不是这个文件」
 * 判断它是素材，现在没有同等强度的证据，新孤儿一律先进 triage，不冒充已知。
 */
function classifyOrphan(relPath) {
    const abs = path.join(policy.book, relPath)
    let raw = ''
    try { raw = fs.readFileSync(abs, 'utf8') }
    catch { return 'triage' }

    const { data } = readFrontMatter(raw)
    const rbook = (data.rbook && typeof data.rbook === 'object' && !Array.isArray(data.rbook)) ? data.rbook : {}

    const status = String(rbook.status || rbook.state || data.status || data.state || '').toLowerCase()
    if (status.includes('todo') || status.includes('draft')) return 'draft'

    // 有 rbook.id = 这份 md 自称是文章，只是没挂进 catalog（P0 债务）
    if (String(rbook.id || '').trim()) return 'identity'

    // 其余没有强证据，一律进 triage，由人判断是文章还是素材
    return 'triage'
}

const REASONS = new Set(['aux', 'draft', 'triage'])

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
    return { orphans, articleCount: leaves.length, leaves }
}

/** 标题靠 catalog 导航名冒充的文章：既没有 config.title，也没有 frontmatter title。 */
function findUntitledLeaves(leaves) {
    const result = []
    for (const leaf of leaves) {
        let resolved
        try {
            resolved = resolveArticleSource(leaf, policy.book, [])
        }
        catch { continue }
        const raw = resolved.source.raw
        // 与 markdown/create-markdown-renderer.ts 的 renderMarkdown 同口径：
        // 只认文件头 YAML frontmatter 里的 title，不认 H1。
        const headerTitle = frontMatterTitle(raw)
        if (titleNeedsAuthoring({ metadataTitle: resolved.metadata.title, headerTitle })) {
            result.push({ leaf, id: resolved.metadata.id })
        }
    }
    return result
}

/**
 * menu_title 太长会把侧边栏撑爆。
 *
 * 只查新字段：catalog.yaml 里那些存量短名（有的本来就 23 个字）不报，避免一上来
 * 就淹没在历史告警里。
 */
function findLongMenuTitles(leaves) {
    const result = []
    for (const leaf of leaves) {
        let resolved
        try {
            resolved = resolveArticleSource(leaf, policy.book, [])
        }
        catch { continue }
        const menuTitle = String(resolved.metadata.menuTitle || '').trim()
        if (!menuTitle) continue
        const width = menuTitleWidth(menuTitle)
        if (width > MENU_TITLE_MAX_WIDTH) result.push({ leaf, menuTitle, width })
    }
    return result
}

function readAllowlist() {
    if (!fs.existsSync(allowlistPath)) return { allowed: [] }
    try {
        const payload = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'))
        const entries = Array.isArray(payload.allowed) ? payload.allowed : []
        const problems = []
        const allowed = []
        for (const entry of entries) {
            if (typeof entry === 'string') {
                problems.push(`allowlist 条目必须是 { path, reason } 对象: ${entry}`)
                continue
            }
            if (!entry || typeof entry.path !== 'string' || !entry.path) {
                problems.push(`allowlist 条目缺少 path: ${JSON.stringify(entry)}`)
                continue
            }
            if (!REASONS.has(entry.reason)) {
                problems.push(`allowlist 条目 reason 非法（可选 ${[...REASONS].join('/')}）: ${entry.path} -> ${entry.reason}`)
                continue
            }
            allowed.push(entry)
        }
        return { allowed, problems }
    }
    catch (e) {
        throw new Error(`orphan-allowlist.json 解析失败: ${e.message}`)
    }
}

function main() {
    const update = process.argv.includes('--update-orphans')
    const { orphans, leaves } = computeOrphans()

    const auxiliary = orphans.filter(o => AUXILIARY_FILE_RE.test(path.basename(o)))
    const realOrphans = orphans.filter(o => !AUXILIARY_FILE_RE.test(path.basename(o)))
    const classified = realOrphans.map(p => ({ path: p, kind: classifyOrphan(p) }))

    if (update) {
        const payload = {
            note: '这些 md 从 catalog 无法到达（也没被 include / teach_plan 引用），因此不会发布。reason 必须写明原因：identity=有 config 声明为文章但没挂进 catalog（P0，优先处理）；aux=目录里非文章的素材；draft=标了 TODO/draft；triage=尚未判断。',
            // identity 不是可写的 reason，而是「有 config 声明为文章」这一事实；
            // 它只能以 triage 记为待处理债务，不能靠 aux/draft 豁免。
            allowed: classified.map(item => ({
                path: item.path,
                reason: item.kind === 'identity' ? 'triage' : item.kind,
            })),
        }
        fs.writeFileSync(allowlistPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
        console.log(`\n已写入 ${path.relative(PROJECT_ROOT, allowlistPath)}（${classified.length} 项）`)
        console.log(`辅助文件（按文件名自动忽略 ${auxiliary.length} 个）: ${[...new Set(auxiliary.map(a => path.basename(a)))].sort().join(', ')}`)
        return
    }

    const { allowed, problems = [] } = readAllowlist()
    const allowedSet = new Set(allowed.map(a => a.path))
    const newcomerPaths = realOrphans.filter(o => !allowedSet.has(o))
    const stale = allowed.map(a => a.path).filter(p => !realOrphans.includes(p))

    console.log(`孤儿 md: ${orphans.length}（辅助文件 ${auxiliary.length} + 待确认 ${realOrphans.length}）`)

    for (const problem of problems) {
        diag.push({
            phase: 'orphan-check',
            level: 'error',
            message: problem,
            suggestion: '运行 node tests/check-catalog.js --update-orphans 重新生成，再逐条校正 reason',
        })
    }

    const byPath = new Map(classified.map(c => [c.path, c.kind]))
    for (const item of allowed) {
        const kind = byPath.get(item.path)
        // 有 config 声明为文章的文件不能靠 aux/draft 豁免：它是要发布的文章，只是没挂菜单。
        if (kind === 'identity' && item.reason !== 'triage') {
            diag.push({
                phase: 'orphan-check',
                level: 'error',
                message: `${item.path} 所在目录的 config 把它声明为文章，不能用 reason=${item.reason} 豁免`,
                suggestion: '把它挂进 catalog.yaml，或改用 reason=triage 记为待处理债务',
            })
        }
    }

    const p0 = classified.filter(c => c.kind === 'identity')
    if (p0.length > 0) {
        console.log(`\nP0 待处理: ${p0.length} 个文件有 config 声明为文章，但不在 catalog.yaml 里（既不构建也不导航）:`)
        for (const item of p0) console.log(`  - ${item.path}`)
        console.log('  三条出路：挂进 catalog.yaml（推荐）／加 hidden: true 渲染但不进侧边栏／降级为素材（改 config 的 file）')
    }

    const untitled = findUntitledLeaves(leaves)
    if (untitled.length > 0) {
        console.log(`\n标题靠导航名兜底: ${untitled.length} 篇（既没有 config.title，md frontmatter 里也没有 title）:`)
        for (const item of untitled) console.log(`  - ${item.leaf} (id=${item.id})`)
        console.log('  这几篇的页面标题与 catalog.json 会显示 catalog.yaml 的导航名；补 config.title 或 md frontmatter 的 title 即可')
    }

    const longMenuTitles = findLongMenuTitles(leaves)
    for (const item of longMenuTitles) {
        diag.push({
            phase: 'menu-title',
            sourcePath: item.leaf,
            level: 'warning',
            message: `menu_title「${item.menuTitle}」宽 ${item.width}，超过上限 ${MENU_TITLE_MAX_WIDTH}（约 ${MENU_TITLE_MAX_WIDTH / 2} 个汉字），侧边栏会撑爆`,
            suggestion: '把 menu_title 改短，或者干脆删掉它，回退到 catalog.yaml 里的短名',
        })
    }

    if (stale.length > 0) {
        console.log(`\n提示: allowlist 中 ${stale.length} 项已不再是孤儿，可以从 orphan-allowlist.json 删除:`)
        stale.forEach(s => console.log(`  - ${s}`))
    }

    if (newcomerPaths.length > 0) {
        diag.push({
            phase: 'orphan-check',
            level: 'error',
            message: `发现 ${newcomerPaths.length} 个新的孤儿 md（写了但不会发布）: ${newcomerPaths.slice(0, 5).join(', ')}${newcomerPaths.length > 5 ? ' …' : ''}`,
            suggestion: '把它们挂进 catalog，或经确认后运行 node tests/check-catalog.js --update-orphans 登记并写明 reason',
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
