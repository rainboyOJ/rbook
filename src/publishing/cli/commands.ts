import { Command } from 'commander'
import path from 'path'
import { loadCatalog } from '../content/catalog-loader'
import { flattenCatalog, flattenCatalogLeaves } from '../domain/catalog'
import { resolveArticleSource } from '../content/source-resolver'
import { PathPolicy } from '../content/path-policy'
import { buildArticleIndex } from '../domain/index'
import { PageTemplateRenderer } from '../templates/page-template-renderer'
import { ArtifactWriter } from '../pipeline/artifact-writer'
import { renderArticle } from '../pipeline/render-article'
import { renderMany } from '../pipeline/render-many'
import { Diagnostic, formatDiagnostic } from '../domain/diagnostics'
import { BuildStageContext } from '../build/stages'
import { getProfile } from '../build/profiles'
import { runStages } from '../build/stages'
import { reportDiagnostics } from '../build/diagnostics-reporter'
import { ContentMacrosOptions } from '../markdown/plugins/content-macros'
import { MenuRenderer } from '../domain/menu-renderer'
import { frontMatterTitle, resolveArticleTitle } from '../domain/article-title'

export interface CliOptions {
    projectRoot: string
    problemProvider?: import('../integrations/problem-provider').ProblemProvider
    practiceProvider?: import('../integrations/pcs2-practice-provider').Pcs2PracticeProvider | null
    /** practiceProvider 为 null 时的原因，full profile 会据此中断构建 */
    practiceUnavailableReason?: string
    blogUrl?: string
    rojBaseUrl?: string
    templateName?: string
    contentMacros?: ContentMacrosOptions
}

export function createCli(opts: CliOptions): Command {
    const program = new Command()
    program
        .name('rbook')
        .description('rbook 电子书发布工具')
        .version('0.2.0')

    const policy = new PathPolicy(opts.projectRoot)
    const catalogPath = path.join(policy.book, 'catalog.yaml')
    const initialCatalog = loadCatalog(catalogPath)
    const templateRenderer = new PageTemplateRenderer({
        templateDir: path.join(opts.projectRoot, 'src', 'ejs'),
        root: opts.projectRoot,
        menuHtml: new MenuRenderer({
            templateDir: path.join(opts.projectRoot, 'src', 'ejs'),
            root: opts.projectRoot,
            leafHref: leaf => policy.publishHref(resolveArticleSource(leaf, policy.book).source.filePath),
            // 与正式构建同源：config.title → frontmatter title，取不到再用清单名。
            leafMeta: leaf => {
                const resolved = resolveArticleSource(leaf, policy.book)
                // 菜单名空着就回退到清单名；正文标题只进 data-*，别填「未知」。
                return {
                    menuTitle: resolved.metadata.menuTitle,
                    articleId: resolved.metadata.id,
                    articleTitle: (resolved.metadata.title || '').trim()
                        || frontMatterTitle(resolved.source.raw),
                }
            },
        }).render(initialCatalog),
    })

    function buildSharedContext(diag: Diagnostic[]) {
        const catalog = loadCatalog(catalogPath, diag)
        const catalogTitleByPath = new Map(flattenCatalogLeaves(catalog).map(leaf => [leaf.path, leaf.title]))
        const leaves = flattenCatalog(catalog)
        const entries = leaves.map(leaf => {
            const resolved = resolveArticleSource(leaf, policy.book, diag)
            return {
                id: resolved.metadata.id,
                title: resolveArticleTitle({
                    metadataTitle: resolved.metadata.title,
                    headerTitle: frontMatterTitle(resolved.source.raw),
                    catalogTitle: catalogTitleByPath.get(leaf),
                }),
                sourcePath: resolved.source.filePath,
                publishHref: policy.publishHref(resolved.source.filePath),
                metadata: resolved.metadata,
            }
        })
        const index = buildArticleIndex(catalog, entries)
        return { catalog, leaves, entries, index }
    }

    program.command('catalog')
        .description('目录清单操作')
        .argument('<command>', 'validate')
        .action((command: string, options: unknown, commandObj: Command) => {
            const diag: Diagnostic[] = []
            try {
                const ctx = buildSharedContext(diag)
                if (command === 'validate') {
                    console.log(`catalog 条目数: ${ctx.catalog.entries.length}`)
                    console.log(`叶子文章数: ${ctx.leaves.length}`)
                    const errors = diag.filter(d => d.level === 'error')
                    const warnings = diag.filter(d => d.level === 'warning')
                    if (errors.length > 0) {
                        console.error(`\n错误 (${errors.length}):`)
                        errors.forEach(e => console.error(`  ${formatDiagnostic(e)}`))
                        process.exitCode = 1
                    }
                    if (warnings.length > 0) {
                        console.log(`\n警告 (${warnings.length}):`)
                        warnings.forEach(w => console.log(`  ${formatDiagnostic(w)}`))
                    }
                    if (errors.length === 0) console.log('\n✓ catalog 验证通过')
                }
                else {
                    console.error(`不支持的命令: ${command}`)
                    process.exitCode = 1
                }
            }
            catch (e) {
                console.error(`错误: ${e instanceof Error ? e.message : String(e)}`)
                process.exitCode = 1
            }
        })

    program.command('render')
        .description('渲染单篇文章 (id 或 book 相对路径)')
        .argument('<id-or-path>', '文章 id 或 book 相对路径')
        .option('-o, --output <path>', '输出 HTML 到指定文件 (默认写 dist)')
        .action((target: string, options: { output?: string }) => {
            const diag: Diagnostic[] = []
            try {
                const ctx = buildSharedContext(diag)
                // 查找目标: 先按 id，再按路径
                let entryPath = ''
                const byId = ctx.index.byId.get(target)
                if (byId) {
                    entryPath = path.relative(policy.book, byId.sourcePath)
                }
                else {
                    entryPath = target
                }

                const result = renderArticle({
                    entryPath,
                    policy,
                    index: ctx.index,
                    templateRenderer,
                    problemProvider: opts.problemProvider,
                    practiceProvider: opts.practiceProvider,
                    blogUrl: opts.blogUrl,
                    rojBaseUrl: opts.rojBaseUrl,
                    diagnostics: diag,
                    debug: true,
                    contentMacros: opts.contentMacros,
                })

                if (options.output) {
                    const writer = new ArtifactWriter({ diagnostics: diag })
                    writer.writeHtml(options.output, result.html)
                    console.log(`已写入: ${options.output}`)
                }
                else {
                    const writer = new ArtifactWriter({ diagnostics: diag })
                    writer.writeHtml(result.view.outputPath, result.html)
                    console.log(`已写入: ${result.view.outputPath}`)
                }

                const errors = diag.filter(d => d.level === 'error')
                if (errors.length > 0) {
                    errors.forEach(e => console.error(`  ${formatDiagnostic(e)}`))
                }
            }
            catch (e) {
                console.error(`渲染失败: ${e instanceof Error ? e.message : String(e)}`)
                process.exitCode = 1
            }
        })

    program.command('render-all')
        .description('渲染所有文章')
        .option('--lenient', '遇到错误继续，仅本地查看')
        .action((options: { lenient?: boolean }) => {
            const diag: Diagnostic[] = []
            try {
                const ctx = buildSharedContext(diag)
                const result = renderMany(ctx.leaves, {
                    entryPath: '',
                    policy,
                    index: ctx.index,
                    templateRenderer,
                    problemProvider: opts.problemProvider,
                    practiceProvider: opts.practiceProvider,
                    blogUrl: opts.blogUrl,
                    rojBaseUrl: opts.rojBaseUrl,
                    diagnostics: diag,
                    withRelated: true,
                    debug: false,
                    contentMacros: opts.contentMacros,
                })

                console.log(`总文章: ${result.total}`)
                console.log(`成功: ${result.succeeded}`)
                console.log(`失败: ${result.failed}`)

                const errors = diag.filter(d => d.level === 'error')
                errors.forEach(e => console.error(`  ${formatDiagnostic(e)}`))

                if (!options.lenient && result.failed > 0) {
                    process.exitCode = 1
                }
            }
            catch (e) {
                console.error(`批量渲染失败: ${e instanceof Error ? e.message : String(e)}`)
                process.exitCode = 1
            }
        })

    program.command('diagnostics')
        .description('运行全量诊断，不写盘')
        .action(() => {
            const diag: Diagnostic[] = []
            try {
                buildSharedContext(diag)
                const errors = diag.filter(d => d.level === 'error')
                const warnings = diag.filter(d => d.level === 'warning')
                console.log(`诊断: ${errors.length} 错误, ${warnings.length} 警告`)
                errors.forEach(e => console.log(`  ${formatDiagnostic(e)}`))
                warnings.forEach(w => console.log(`  ${formatDiagnostic(w)}`))
                if (errors.length > 0) process.exitCode = 1
            }
            catch (e) {
                console.error(`诊断失败: ${e instanceof Error ? e.message : String(e)}`)
                process.exitCode = 1
            }
        })

    program.command('build')
        .description('构建发布产物')
        .option('--profile <name>', '发布 profile: core 或 full', 'core')
        .action((options: { profile: string }) => {
            const diag: Diagnostic[] = []
            try {
                const profile = getProfile(options.profile)
                console.log(`[build] profile: ${profile.name}`)

                // 缺 pcs2 数据时，所有文章都会渲染成「暂无相关题解」。发布路径（full）
                // 必须中断，否则会把错内容静默同步到线上；本地 core 只告警。
                if (!opts.practiceProvider) {
                    const message = `pcs2 题目数据不可用: ${opts.practiceUnavailableReason || '未知原因'}`
                    if (profile.name === 'full') {
                        throw new Error(`${message}\n提示: 确认 ~/mycode/rbook_new_problem_solutions/problems 存在，或设置 PCS2_PROBLEMS_DIR`)
                    }
                    diag.push({
                        phase: 'practice-provider',
                        level: 'warning',
                        message,
                        suggestion: '设置 PCS2_PROBLEMS_DIR，或确认兄弟仓库存在',
                    })
                }
                else {
                    console.log(`[build] pcs2: ${opts.practiceProvider.articleCount} 篇文章有关联题解（扫 ${opts.practiceProvider.fileCount} 个题目文件）`)
                }
                const ctx: BuildStageContext = {
                    projectRoot: opts.projectRoot,
                    policy,
                    diagnostics: diag,
                    problemProvider: opts.problemProvider,
                    practiceProvider: opts.practiceProvider,
                    blogUrl: opts.blogUrl,
                    rojBaseUrl: opts.rojBaseUrl,
                    contentMacros: opts.contentMacros,
                    stageResults: {},
                }
                const ok = runStages(profile.stages, ctx)
                reportDiagnostics(diag)
                if (!ok) {
                    console.error('[build] 构建失败')
                    process.exitCode = 1
                }
                else {
                    console.log('[build] 构建成功')
                }
            }
            catch (e) {
                console.error(`构建失败: ${e instanceof Error ? e.message : String(e)}`)
                process.exitCode = 1
            }
        })

    return program
}
