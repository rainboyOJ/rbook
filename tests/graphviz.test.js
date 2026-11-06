const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const MarkdownIt = require('markdown-it')
const { createMarkdownRenderer } = require('../.tsbuild/publishing/markdown/create-markdown-renderer.js')
const { renderGraphvizSvg } = require('../.tsbuild/publishing/markdown/plugins/graphviz.js')
const { renderPages } = require('../.tsbuild/publishing/build/stages.js')
const { PathPolicy } = require('../.tsbuild/publishing/content/path-policy.js')

const ROOT = path.resolve(__dirname, '..')
const index = { byId: new Map(), bySourcePath: new Map(), byPublishHref: new Map(), all: [] }
function renderer(options = {}) { return createMarkdownRenderer({ index, ...options }) }
function fence(language, source) { return '```' + language + '\n' + source + '\n```' }

it('dot 和 viz-dot 都生成真实 SVG，保留中文标签及作者的颜色', () => {
    for (const language of ['dot', 'viz-dot', 'DOT', 'VIZ-DOT']) {
        const html = renderer().render(fence(language, 'digraph G { a [label="原生位操作",color=red]; a -> b; }'))
        const svg = html.match(/<svg\b[\s\S]*?<\/svg>/)[0]
        assert.ok(svg.includes('原生位操作'))
        assert.ok(svg.includes('class="edge"'))
        assert.ok(svg.includes('stroke="red"'))
        assert.ok(!html.includes('<?xml'))
        assert.ok(!html.includes('<!DOCTYPE'))
        assert.ok(html.includes('<details class="rbook-graphviz__source"><summary>查看 DOT 源码</summary>'))
        assert.ok(!html.includes('rbook-graphviz__source" open'))
    }
})

it('折叠源码与复制属性保留原始文本、换行和特殊字符', () => {
    const source = 'digraph G {\n  a [label="<bitset> & 字符"];\n  a -> b;\n}\n'
    const html = renderer().render('```dot\n' + source + '```')
    const clipboard = html.match(/data-clipboard-text="([\s\S]*?)"/)[1]
    assert.equal(new MarkdownIt().utils.unescapeAll(clipboard), source)
    assert.ok(html.includes('class="language-dot"'))
    assert.ok(html.includes('onclick="window.myclipboard(this)"'))
})

it('同页多图具有唯一 ID，重复渲染时编号从头开始', () => {
    const md = renderer()
    const source = fence('dot', 'digraph G { a -> b; }') + '\n\n' + fence('viz-dot', 'digraph G { a -> b; }')
    const env = {}
    const html = md.render(source, env)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1])
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(ids.includes('rbook-graphviz-1-graph0'))
    assert.ok(ids.includes('rbook-graphviz-2-graph0'))
    assert.equal(md.render(source, env), html)
})

it('SVG 内部链接跟随 ID 前缀更新', () => {
    const svg = renderGraphvizSvg('digraph G { a [id="target",URL="#target"]; }', { idPrefix: 'test-' })
    assert.ok(svg.includes('id="test-target"'))
    assert.ok(svg.includes('href="#test-target"'))
})

it('Graphviz 支持 file= 及代码标签页', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-dot-'))
    try {
        fs.writeFileSync(path.join(dir, 'figure.dot'), 'digraph G { a -> b; }')
        const html = renderer({ include: { roots: [dir], currentFile: path.join(dir, 'index.md') } }).render(
            '```dot [graph:图] file=./figure.dot\n```\n```cpp [graph:C++]\nint main() {}\n```',
        )
        assert.ok(html.includes('class="code-tabs"'))
        assert.ok(html.includes('<svg role="img"'))
        assert.ok(!html.includes('include-missing'))
    }
    finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

it('语法错误报告文章路径和代码块位置，并直接中断渲染', () => {
    const diagnostics = []
    assert.throws(() => renderer({ diagnostics, currentSourcePath: '/book/bad.md' }).render('前文\n\n```dot\ndigraph G { a -> }\n```'), /bad\.md:3: Graphviz 渲染失败/)
    assert.equal(diagnostics[0].phase, 'graphviz')
    assert.equal(diagnostics[0].level, 'error')
    assert.equal(diagnostics[0].line, 3)
    assert.ok(diagnostics[0].message.includes('syntax error'))
})

it('缺少 dot 命令明确报错，不回退为普通源码', () => {
    const diagnostics = []
    assert.throws(() => renderGraphvizSvg('digraph G { a -> b }', {
        idPrefix: 'missing-', command: '/definitely/not/installed/graphviz-dot', diagnostics,
    }), /未找到 Graphviz 的 dot 命令/)
    assert.equal(diagnostics[0].level, 'error')
})

it('构建机器缺少 dot 时，文章渲染命令返回失败且不写出页面', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-dot-missing-'))
    try {
        const output = path.join(dir, 'binary.html')
        const result = spawnSync(process.execPath, ['.tsbuild/publishing/cli/index.js', 'render', 'binary', '-o', output], {
            cwd: ROOT, env: { ...process.env, PATH: '/definitely/no/commands' }, encoding: 'utf8',
        })
        assert.equal(result.status, 1)
        assert.ok(result.stderr.includes('未找到 Graphviz 的 dot 命令'))
        assert.ok(!fs.existsSync(output))
    }
    finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

it('空代码块或同一代码块包含多张图会报错', () => {
    for (const source of ['', 'digraph A { a -> b }\ndigraph B { c -> d }']) {
        assert.throws(() => renderer().render(fence('dot', source)), /一张有效的 SVG/)
    }
})

it('普通文本代码块中的 DOT 不会被自动当成图形', () => {
    const html = renderer().render(fence('text', 'digraph G { a -> b; }'))
    assert.ok(!html.includes('<svg'))
    assert.ok(html.includes('digraph G'))
})

it('图形失败会阻断发布阶段，不写出坏文章', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-dot-build-'))
    try {
        const policy = new PathPolicy(dir)
        fs.mkdirSync(policy.book, { recursive: true })
        fs.writeFileSync(path.join(policy.book, 'bad.md'), fence('dot', 'digraph G { a -> }'))
        const ctx = { projectRoot: ROOT, policy, diagnostics: [], stageResults: { index, leaves: ['bad.md'], menuHtml: '' } }
        assert.throws(() => renderPages.run(ctx), /1 篇文章渲染失败/)
        assert.ok(ctx.diagnostics.some(d => d.phase === 'graphviz' && d.level === 'error'))
        assert.ok(!fs.existsSync(path.join(policy.dist, 'bad.html')))
    }
    finally { fs.rmSync(dir, { recursive: true, force: true }) }
})

it('关联教学计划中的 Graphviz 出错也会阻断发布阶段', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-dot-related-'))
    try {
        const policy = new PathPolicy(dir)
        const article = path.join(policy.book, 'article')
        fs.mkdirSync(article, { recursive: true })
        fs.writeFileSync(path.join(article, 'config.json'), JSON.stringify({ id: 'graph-test', title: '测试', file: 'index.md', teach_plan: 'teach_plan.md' }))
        fs.writeFileSync(path.join(article, 'index.md'), '## 正文\n\n正常文章')
        fs.writeFileSync(path.join(article, 'teach_plan.md'), fence('viz-dot', 'digraph G { a -> }'))
        const ctx = { projectRoot: ROOT, policy, diagnostics: [], stageResults: { index, leaves: ['article'], menuHtml: '' } }
        assert.throws(() => renderPages.run(ctx), /Graphviz 图形渲染失败/)
        assert.ok(ctx.diagnostics.some(d => d.phase === 'graphviz' && d.sourcePath.endsWith('teach_plan.md')))
    }
    finally { fs.rmSync(dir, { recursive: true, force: true }) }
})
