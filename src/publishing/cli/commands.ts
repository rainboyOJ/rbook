import { Command } from 'commander'
import path from 'path'
import { loadCatalog } from '../content/catalog-loader'
import { flattenCatalog } from '../domain/catalog'
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

export interface CliOptions {
    projectRoot: string
    problemProvider?: import('../integrations/problem-provider').ProblemProvider
    blogUrl?: string
    rojBaseUrl?: string
    templateName?: string
}

export function createCli(opts: CliOptions): Command {
    const program = new Command()
    program
        .name('rbook')
        .description('rbook 电子书发布工具')
        .version('0.2.0')

    const policy = new PathPolicy(opts.projectRoot)
    const catalogPath = path.join(policy.book, 'catalog.yaml')
    const templateRenderer = new PageTemplateRenderer({
        templateDir: path.join(opts.projectRoot, 'src', 'ejs'),
        root: opts.projectRoot,
    })

    function buildSharedContext(diag: Diagnostic[]) {
        const catalog = loadCatalog(catalogPath, diag)
        const leaves = flattenCatalog(catalog)
        const entries = leaves.map(leaf => {
            const resolved = resolveArticleSource(leaf, policy.book, diag)
            return {
                id: resolved.metadata.id,
                title: resolved.metadata.title,
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
                    blogUrl: opts.blogUrl,
                    rojBaseUrl: opts.rojBaseUrl,
                    diagnostics: diag,
                    debug: true,
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
                    blogUrl: opts.blogUrl,
                    rojBaseUrl: opts.rojBaseUrl,
                    diagnostics: diag,
                    withRelated: true,
                    debug: false,
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
                const ctx: BuildStageContext = {
                    projectRoot: opts.projectRoot,
                    policy,
                    diagnostics: diag,
                    problemProvider: opts.problemProvider,
                    blogUrl: opts.blogUrl,
                    rojBaseUrl: opts.rojBaseUrl,
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