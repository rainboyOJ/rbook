// markdown-it.js — 兼容导出
// 新渲染管线位于 src/publishing/markdown/
// 此文件保留为过渡 shim，全量切换后删除
const P = require("path")
const { createMarkdownRenderer, renderMarkdown } = require("../.tsbuild/publishing/markdown/create-markdown-renderer.js")
const { loadCatalog } = require(P.join(__dirname, "..", ".tsbuild", "publishing", "content", "catalog-loader.js"))
const { flattenCatalog } = require(P.join(__dirname, "..", ".tsbuild", "publishing", "domain", "catalog.js"))
const { buildArticleIndex } = require(P.join(__dirname, "..", ".tsbuild", "publishing", "domain", "index.js"))
const { resolveArticleSource } = require(P.join(__dirname, "..", ".tsbuild", "publishing", "content", "source-resolver.js"))
const { PathPolicy } = require(P.join(__dirname, "..", ".tsbuild", "publishing", "content", "path-policy.js"))

const policy = new PathPolicy(P.join(__dirname, ".."))
const catalog = loadCatalog(P.join(policy.book, "catalog.yaml"))
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
const index = buildArticleIndex(catalog, entries)

const md = createMarkdownRenderer({
    index,
    blogUrl: "https://rbook.roj.ac.cn",
    rojBaseUrl: "https://roj.ac.cn",
})

md.env = {}
md.env.blog_url = "https://rbook.roj.ac.cn"
md.env.base_path = policy.book

module.exports = { md, render: (raw, config) => renderMarkdown(raw, md, config.mdit || {}) }