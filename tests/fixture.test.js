const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { runFixture, assertMarkers } = require('./helpers/fixture-runner.js')

const FIXTURES = path.join(__dirname, 'fixtures', 'markdown')

describe('发布契约 fixtures', () => {
    it('basic-syntax.md 渲染出标题/列表/表格/代码', () => {
        const { html } = runFixture(path.join(FIXTURES, 'basic-syntax.md'))
        assertMarkers(html, ['<h2', '<ul>', '<table>', '<pre>'], assert)
    })

    it('containers.md 渲染容器', () => {
        const { html } = runFixture(path.join(FIXTURES, 'containers.md'))
        assertMarkers(html, ['oneWordAlgo', 'colorfulbox', 'warning', 'info', 'error', 'blackboard'], assert)
    })

    it('fences.md 渲染各种代码块', () => {
        const { html } = runFixture(path.join(FIXTURES, 'fences.md'))
        assertMarkers(html, ['<pre'], assert)
    })

    it('excalidraw.md 渲染相对路径图片', () => {
        const { html } = runFixture(path.join(FIXTURES, 'excalidraw.md'))
        assertMarkers(html, ['<img'], assert)
    })

    it('snapshot normalizer 去除动态字段', () => {
        const { normalizeSnapshot } = require('./helpers/snapshot-normalizer.js')
        const dirty = `<img src="https://visitor-badge.laobi.icu/badge?page_id=rbook_presum"> path=/home/rainboy/x date=2026-09-05`
        const clean = normalizeSnapshot(dirty)
        assert.ok(!clean.includes('/home/'), '绝对路径未去除')
        assert.ok(!clean.includes('visitor-badge'), '访问徽章未去除')
        assert.ok(!clean.includes('2026'), '日期未去除')
    })

    it('不依赖外部题库', () => {
        const fs = require('fs')
        const fixtureList = fs.readdirSync(FIXTURES)
        assert.ok(fixtureList.length >= 7, '至少 7 个 fixture')
        for (const f of fixtureList) {
            const raw = fs.readFileSync(path.join(FIXTURES, f), { encoding: 'utf8' })
            assert.ok(!raw.includes('../../problems/'), `${f} 引用了外部题库路径`)
        }
    })
})