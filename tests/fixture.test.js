const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const { runFixture, assertMarkers } = require('./helpers/fixture-runner.js')

const FIXTURES = path.join(__dirname, 'fixtures', 'markdown')

describe('发布契约 fixtures', () => {
    it('basic-syntax.md 渲染出标题/列表/表格/代码及KaTeX数学公式', () => {
        const { html } = runFixture(path.join(FIXTURES, 'basic-syntax.md'))
        assertMarkers(html, ['<h2', '<ul>', '<table>', '<pre', 'class="katex"'], assert)
    })

    it('containers.md 渲染容器', () => {
        const { html } = runFixture(path.join(FIXTURES, 'containers.md'))
        assertMarkers(html, [
            'class="oneWordAlgo"',
            'class="colorfulbox bg-light"',
            'class="warning"',
            'class="info"',
            'class="error"',
            'class="blackboard"',
            '<details>',
        ], assert)
    })

    it('fences.md 渲染各种代码块及伪代码', () => {
        const { html } = runFixture(path.join(FIXTURES, 'fences.md'))
        assertMarkers(html, [
            'class="mermaid"',
            'class="plantuml"',
            'class="dot"',
            'class="pseudocode"',
            'markdown-it-code-copy',
        ], assert)
    })

    it('excalidraw.md 渲染相对路径图片及交互按钮', () => {
        const { html } = runFixture(path.join(FIXTURES, 'excalidraw.md'))
        assertMarkers(html, ['<img', 'class="image-wrapper"', 'image-extension-badge'], assert)
    })

    it('triple-brackets.md 渲染文章链接与题解链接', () => {
        const { html } = runFixture(path.join(FIXTURES, 'triple-brackets.md'))
        assertMarkers(html, ['class="extra-link"', '/base/presum/index.html'], assert)
    })

    it('problem-list.md 渲染题目列表容器', () => {
        const { html } = runFixture(path.join(FIXTURES, 'problem-list.md'))
        assertMarkers(html, ['class="problem_list_content"'], assert)
    })

    it('ejs-macros.md 渲染常用宏 (video, dvideo, iframe, pid_to_url)', () => {
        const { html } = runFixture(path.join(FIXTURES, 'ejs-macros.md'))
        assertMarkers(html, [
            '<video',
            '/video/test_video.mp4',
            'https://d.roj.ac.cn/d/RainboyVideo/test_video.mp4',
            '<iframe',
            '<a href="https://roj.ac.cn/luogu/8218"',
        ], assert)
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