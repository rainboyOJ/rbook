/**
 * fixture-runner.js
 *
 * 独立运行一个 markdown fixture 的可复用入口。
 * 不依赖外部题库、LokiJS 或仓库外路径。
 *
 * 返回 { normalized, html, diagnostics }
 */
const { normalizeSnapshot } = require('./snapshot-normalizer.js')

function runFixture(fixturePath, options = {}) {
    const fs = require('fs')
    const md = require('../../src/lib/markdown-r')

    let raw
    try {
        raw = fs.readFileSync(fixturePath, { encoding: 'utf8' })
    }
    catch (err) {
        throw new Error(`fixture 读取失败: ${fixturePath} (${err.message})`)
    }

    const { header, content } = md.render(raw, { mdit: {} })
    const html = content
    const normalized = normalizeSnapshot(html)
    return { normalized, html, header }
}

function assertMarkers(html, markers, assert) {
    for (const marker of markers) {
        assert.ok(html.includes(marker), `缺少关键 HTML 标记: ${marker}`)
    }
}

module.exports = { runFixture, assertMarkers, normalizeSnapshot }