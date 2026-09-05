/**
 * check-catalog.js — `npm run check:catalog` 入口
 *
 * 验证 catalog.yaml 的所有条目可解析，报告配置错误。
 * 非零退出 = 有错误。
 */
const path = require('path')
const PROJECT_ROOT = path.resolve(__dirname, '..')
const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))
const { formatDiagnostic } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/diagnostics.js'))

const catalogPath = path.join(PROJECT_ROOT, 'book', 'catalog.yaml')
const policy = new PathPolicy(PROJECT_ROOT)
const diag = []

try {
    const catalog = loadCatalog(catalogPath, diag)
    const leaves = flattenCatalog(catalog)
    console.log(`catalog 条目数: ${catalog.entries.length}`)
    console.log(`叶子文章数: ${leaves.length}`)

    for (const leaf of leaves) {
        try {
            resolveArticleSource(leaf, policy.book, diag)
        }
        catch (e) {
            diag.push({ phase: 'catalog-validate', level: 'error', message: `${leaf}: ${e.message}` })
        }
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
catch (e) {
    console.error(`致命错误: ${e.message}`)
    process.exit(1)
}