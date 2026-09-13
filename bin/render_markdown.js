// bin/render_markdown.js — 兼容过渡 shim
// 内部调用新发布管线的 renderArticle，全量切换后删除
const path = require('path')
const { renderArticle } = require('../.tsbuild/publishing/pipeline/render-article.js')
const { PathPolicy } = require('../.tsbuild/publishing/content/path-policy.js')
const { buildArticleIndex } = require('../.tsbuild/publishing/domain/index.js')
const { loadCatalog } = require('../.tsbuild/publishing/content/catalog-loader.js')
const { flattenCatalog } = require('../.tsbuild/publishing/domain/catalog.js')
const { resolveArticleSource } = require('../.tsbuild/publishing/content/source-resolver.js')
const { PageTemplateRenderer } = require('../.tsbuild/publishing/templates/page-template-renderer.js')
const { ArtifactWriter } = require('../.tsbuild/publishing/pipeline/artifact-writer.js')

const projectRoot = path.resolve(__dirname, '..')
const policy = new PathPolicy(projectRoot)
const templateRenderer = new PageTemplateRenderer({
    templateDir: path.join(projectRoot, 'src', 'ejs'),
    root: projectRoot,
})

let cachedIndex = null
function getIndex() {
    if (cachedIndex) return cachedIndex
    const catalog = loadCatalog(path.join(policy.book, 'catalog.yaml'))
    const leaves = flattenCatalog(catalog)
    const entries = leaves.map(leaf => {
        const resolved = resolveArticleSource(leaf, policy.book, [])
        return {
            id: resolved.metadata.id,
            title: resolved.metadata.title,
            sourcePath: resolved.source.filePath,
            publishHref: policy.publishHref(resolved.source.filePath),
            metadata: resolved.metadata,
        }
    })
    cachedIndex = buildArticleIndex(catalog, entries)
    return cachedIndex
}

function render_md(data) {
    let filePath = ''
    if (typeof data === 'string') {
        filePath = data
    }
    else if (data && data.md_file && data.md_file.file_path) {
        filePath = data.md_file.file_path
    }
    else {
        throw new Error('render_md: 无效的输入参数')
    }

    const entryPath = path.isAbsolute(filePath)
        ? path.relative(policy.book, filePath)
        : filePath

    const index = getIndex()
    const result = renderArticle({
        entryPath,
        policy,
        index,
        templateRenderer,
        withRelated: true,
        debug: false,
    })

    const writer = new ArtifactWriter()
    writer.writeHtml(result.view.outputPath, result.html)
    return result
}

module.exports = render_md
