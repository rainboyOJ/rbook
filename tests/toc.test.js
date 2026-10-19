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
