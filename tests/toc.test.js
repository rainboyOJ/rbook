const { it } = require('node:test')
const assert = require('node:assert/strict')
const { createMarkdownRenderer } = require('../.tsbuild/publishing/markdown/create-markdown-renderer.js')

function renderer() {
    return createMarkdownRenderer({
        index: { byId: new Map(), bySourcePath: new Map(), byPublishHref: new Map(), all: [] },
    })
}

it('[[toc]] 生成分层目录，中文、格式化和重复标题均链接到对应锚点', () => {
    const html = renderer().render('[[toc]]\n\n# 文章标题\n\n## 中文标题\n\n### **重复** `code`\n\n## 中文标题\n\n## !!!')
    assert.ok(html.includes('<nav class="table-of-contents"><ol>'))
    assert.ok(!html.includes('[[toc]]'))
    const nav = html.match(/<nav[\s\S]*?<\/nav>/)[0]
    for (const id of ['中文标题', '重复-code', '中文标题-1', 'section']) {
        assert.ok(nav.includes(`href="#${id}"`))
        assert.ok(html.includes(`id="${id}"`))
    }
    assert.ok(nav.includes('<ol><li><a href="#重复-code">'))
    assert.ok(!nav.includes('文章标题'))
})

it('目录状态按文章重置，代码中的 [[toc]] 保持原样', () => {
    const md = renderer()
    const source = '[[toc]]\n\n## 标题\n\n`[[toc]]`\n\n```text\n[[toc]]\n```'
    const first = md.render(source)
    assert.equal(md.render(source), first)
    assert.equal((first.match(/<nav /g) || []).length, 1)
    assert.ok(first.includes('<code>[[toc]]</code>'))
    assert.ok(md.render('普通正文').includes('<p>普通正文</p>'))
    assert.ok(!md.render('普通正文').includes('<nav'))
})

it('章节和目录共享编号，作者编号不叠加，旧锚点和内联格式保持不变', () => {
    const html = renderer().render('[[toc]]\n\n## 基础\n\n### 普通小节\n\n### P1 子树\n\n### **P2** 区间\n\n## 进阶\n\n### 一、应用\n\n### P3：祖先\n\n### 2-SAT\n\n### P2P\n\n### 2.1 手工编号')
    const headings = [...html.matchAll(/<h[23][^>]*data-heading-number="([^"]+)"/g)].map(m => m[1])
    const tocNumbers = [...html.matchAll(/class="rbook-toc-number">([^<]*)</g)].map(m => m[1])
    assert.deepEqual(headings, ['1', '1.1', 'P1', 'P2', '2', '一、', 'P3：', '2.3', '2.4', '2.1'])
    assert.deepEqual(tocNumbers, headings)
    for (const id of ['p1-子树', 'p2-区间', 'p3祖先', '21-手工编号']) {
        assert.ok(html.includes(`id="${id}"`), id)
        assert.ok(html.includes(`href="#${id}"`), id)
    }
    assert.ok(!html.includes('data-heading-number="1.2 P1"'))
})

it('标题可从 H3 开始，重置到新 H1，转义目录文字且不拆分中途出现的编号', () => {
    const html = renderer().render('[[toc]]\n\n### 起点\n\n#### 下级\n\n# 新篇\n\n## **正文** `<script>` & 说明\n\n### `例子` P1 仍是标题文字\n\n### 2.5维问题')
    assert.deepEqual([...html.matchAll(/data-heading-number="([^"]+)"/g)].map(m => m[1]), ['1', '1.1', '1', '1.1', '1.2'])
    const nav = html.match(/<nav[\s\S]*?<\/nav>/)[0]
    assert.ok(nav.includes('&lt;script&gt; &amp; 说明'))
    assert.ok(nav.includes('例子 P1 仍是标题文字'))
    assert.ok(html.includes('<strong>正文</strong> <code>&lt;script&gt;</code>'))
})
