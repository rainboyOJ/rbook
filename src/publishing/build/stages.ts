import { execSync } from 'child_process'
import path from 'path'
import { Diagnostic } from '../domain/diagnostics'
import { PathPolicy } from '../content/path-policy'
import { buildArticleIndex } from '../domain/index'
import { loadCatalog } from '../content/catalog-loader'
import { flattenCatalog } from '../domain/catalog'
import { resolveArticleSource } from '../content/source-resolver'
import { PageTemplateRenderer } from '../templates/page-template-renderer'
import { renderMany } from '../pipeline/render-many'
import { ProblemProvider } from '../integrations/problem-provider'

export interface BuildStageContext {
    projectRoot: string
    policy: PathPolicy
    diagnostics: Diagnostic[]
    problemProvider?: ProblemProvider
    blogUrl?: string
    rojBaseUrl?: string
    stageResults: Record<string, unknown>
}

export interface BuildStage {
    name: string
    description: string
    run(ctx: BuildStageContext): void
}

export const prepareCatalog: BuildStage = {
    name: 'prepare-catalog',
    description: '读取目录清单、配置、生成索引和验证路径',
    run(ctx) {
        const catalog = loadCatalog(path.join(ctx.policy.book, 'catalog.yaml'), ctx.diagnostics)
        const leaves = flattenCatalog(catalog)
        const entries = leaves.map(leaf => {
            const resolved = resolveArticleSource(leaf, ctx.policy.book, ctx.diagnostics)
            return {
                id: resolved.metadata.id,
                title: resolved.metadata.title,
                sourcePath: resolved.source.filePath,
                publishHref: ctx.policy.publishHref(resolved.source.filePath),
                metadata: resolved.metadata,
            }
        })
        const index = buildArticleIndex(catalog, entries)
        ctx.stageResults['index'] = index
        ctx.stageResults['leaves'] = leaves
        ctx.stageResults['catalog'] = catalog
        console.log(`[prepare-catalog] 叶子文章: ${leaves.length}`)
    },
}

export const renderPages: BuildStage = {
    name: 'render-pages',
    description: '渲染文章与关联文档',
    run(ctx) {
        const index = ctx.stageResults['index'] as ReturnType<typeof buildArticleIndex>
        const leaves = ctx.stageResults['leaves'] as string[]
        const templateRenderer = new PageTemplateRenderer({
            templateDir: path.join(ctx.projectRoot, 'src', 'ejs'),
            root: ctx.projectRoot,
        })
        const result = renderMany(leaves, {
            entryPath: '',
            policy: ctx.policy,
            index,
            templateRenderer,
            problemProvider: ctx.problemProvider,
            blogUrl: ctx.blogUrl,
            rojBaseUrl: ctx.rojBaseUrl,
            diagnostics: ctx.diagnostics,
            withRelated: true,
            debug: false,
        })
        ctx.stageResults['renderResult'] = result
        console.log(`[render-pages] 成功: ${result.succeeded}, 失败: ${result.failed}`)
    },
}

export const buildSiteShell: BuildStage = {
    name: 'build-site-shell',
    description: '调用 Vite/EJS 生成首页和静态壳',
    run(ctx) {
        console.log('[build-site-shell] 开始 vite build')
        execSync('bun run build', {
            cwd: ctx.projectRoot,
            stdio: 'inherit',
        })
        console.log('[build-site-shell] vite build 完成')
    },
}

export const copyAssets: BuildStage = {
    name: 'copy-assets',
    description: '复制书内图片、样式、固定公共资源',
    run(ctx) {
        console.log('[copy-assets] 复制图片')
        const { execSync } = require('child_process')
        execSync('bash ./bin/copy_images.sh', { cwd: ctx.projectRoot, stdio: 'inherit' })
        console.log('[copy-assets] 编译 markdown.css')
        execSync('npx sass ./src/markdown-style/markdown.scss ./dist/markdown.css', {
            cwd: ctx.projectRoot,
            stdio: 'inherit',
        })
        console.log('[copy-assets] 复制 prism-theme')
        execSync('rsync -avP --delete ./src/prism-theme/ ./dist/prism-theme/', {
            cwd: ctx.projectRoot,
            stdio: 'inherit',
        })
        console.log('[copy-assets] 完成')
    },
}

export const buildOptionalWidgets: BuildStage = {
    name: 'build-optional-widgets',
    description: '执行第三方页面、Asymptote、论文和动画等外部步骤',
    run(ctx) {
        console.log('[build-optional-widgets] 编译 third_part')
        execSync('bash ./third_part/build.sh', {
            cwd: ctx.projectRoot,
            stdio: 'inherit',
        })
        console.log('[build-optional-widgets] 复制 assets 目录')
        execSync('rsync_dir_placeholder', { cwd: ctx.projectRoot, stdio: 'ignore' })
        console.log('[build-optional-widgets] 完成')
    },
}

export const ALL_STAGES: BuildStage[] = [
    prepareCatalog,
    renderPages,
    buildSiteShell,
    copyAssets,
    buildOptionalWidgets,
]

export function runStages(stages: BuildStage[], ctx: BuildStageContext): boolean {
    let ok = true
    for (const stage of stages) {
        try {
            stage.run(ctx)
        }
        catch (e) {
            ctx.diagnostics.push({
                phase: stage.name,
                level: 'error',
                message: `阶段失败: ${e instanceof Error ? e.message : String(e)}`,
            })
            console.error(`[${stage.name}] 失败: ${e instanceof Error ? e.message : String(e)}`)
            ok = false
            break
        }
    }
    return ok
}