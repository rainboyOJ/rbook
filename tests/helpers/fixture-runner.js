/**
 * fixture-runner.js
 *
 * 独立运行一个 markdown fixture 的可复用入口。
 * 不依赖外部题库、LokiJS 或仓库外路径。
 *
 * 返回 { normalized, html, diagnostics, header }
 */
const fs = require('fs')
const path = require('path')
const { normalizeSnapshot } = require('./snapshot-normalizer.js')
const { createMarkdownRenderer, renderMarkdown } = require('../../.tsbuild/publishing/markdown/create-markdown-renderer.js')

function createTestIndex() {
    const presumEntry = {
        id: 'presum',
        title: '前缀和',
        sourcePath: '/mock/book/base/presum/index.md',
        publishHref: '/base/presum/index.html',
    }
    const byId = new Map([['presum', presumEntry]])
    const byPath = new Map([[presumEntry.sourcePath, presumEntry]])
    const byHref = new Map([[presumEntry.publishHref, presumEntry]])
    return { byId, byPath, byHref, all: [presumEntry] }
}

const mockProblemProvider = {
    getProblemById(id) {
        return {
            id,
            oj: 'luogu',
            sid: '8218',
            title: '求区间和',
            link: 'https://www.luogu.com.cn/problem/P8218',
            hasSolution: true,
        }
    },
    getProblemsForArticle() {
        return [
            { id: 'luogu-8218', oj: 'luogu', sid: '8218', title: '求区间和', link: '/p/8218', hasSolution: true },
        ]
    },
}

function runFixture(fixturePath, options = {}) {
    let raw
    try {
        raw = fs.readFileSync(fixturePath, { encoding: 'utf8' })
    }
    catch (err) {
        throw new Error(`fixture 读取失败: ${fixturePath} (${err.message})`)
    }

    const diagnostics = []
    const index = options.index || createTestIndex()
    const problemProvider = options.problemProvider || mockProblemProvider

    const md = createMarkdownRenderer({
        index,
        problemProvider,
        diagnostics,
        excalidraw: { basePath: path.dirname(fixturePath) },
        blogUrl: 'https://rbook.roj.ac.cn',
        rojBaseUrl: 'https://roj.ac.cn',
    })

    const { header, content } = renderMarkdown(raw, md, {
        id: 'fixture-test',
        currentMdFilePath: fixturePath,
        root: path.resolve(__dirname, '../..'),
    })

    const html = content
    const normalized = normalizeSnapshot(html)
    return { normalized, html, header, diagnostics }
}

function assertMarkers(html, markers, assert) {
    for (const marker of markers) {
        assert.ok(html.includes(marker), `缺少关键 HTML 标记: ${marker}`)
    }
}

module.exports = { runFixture, assertMarkers, normalizeSnapshot }