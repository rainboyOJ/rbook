const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const sass = require('sass')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { createMarkdownRenderer, renderMarkdown } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/create-markdown-renderer.js'),
)
const { buildArticleIndex } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/index.js'))
const { parseCodeTabsInfo } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/plugins/code-tabs.js'),
)

/**
 * 代码标签页（code tabs）：相邻同组 fence 合成一组单选按钮 + 面板。
 * 面板显隐靠 CSS 的 input:checked + div，所以“无 JS 可切换”是硬要求。
 */
describe('code-tabs：分组与渲染', () => {
    const index = buildArticleIndex({ entries: [], source: '' }, [])
    const zeroNumberDir = path.join(PROJECT_ROOT, 'book', 'base', 'zero_number')

    function render(tpl, opts = {}) {
        const diag = []
        const md = createMarkdownRenderer({ index, diagnostics: diag, projectRoot: PROJECT_ROOT, ...opts })
        const env = {
            currentMdFilePath: path.join(zeroNumberDir, 'index.md'),
            root: PROJECT_ROOT,
            basePath: path.join(PROJECT_ROOT, 'book'),
        }
        const { content } = renderMarkdown(tpl, md, env)
        return { html: content, diag }
    }

    const pair = [
        '```cpp [g1:C++]',
        'int main() { return 0; }',
        '```',
        '```py [g1:Python]',
        'print(1)',
        '```',
        '',
    ].join('\n')

    it('相邻同组 fence 合成一组，输出单选按钮 + 面板', () => {
        const { html, diag } = render(pair)

        assert.equal((html.match(/class="code-tabs"/g) || []).length, 1, '应只有一个标签组容器')
        assert.equal((html.match(/class="code-tabs-pane"/g) || []).length, 2, '应有两个面板')
        assert.equal((html.match(/class="code-tabs-radio"/g) || []).length, 2, '每个面板一个 radio')

        // 同一组共用一个 radio name，第一块默认选中
        const names = [...html.matchAll(/name="([^"]+)"/g)].map(m => m[1])
        assert.equal(new Set(names).size, 1, `radio 应同组同名，实际: ${names}`)
        assert.equal((html.match(/ checked>/g) || []).length, 1, '只应有一个默认选中')

        // 标签栏按顺序给出标签，并与面板 id 对应
        const labels = [...html.matchAll(/<label for="([^"]+)"[^>]*>([^<]+)<\/label>/g)]
            .map(m => ({ id: m[1], text: m[2] }))
        assert.deepEqual(labels.map(l => l.text), ['C++', 'Python'], `标签顺序不对: ${JSON.stringify(labels)}`)
        for (const label of labels) {
            assert.ok(html.includes(`id="${label.id}"`), `标签 ${label.text} 的 for 找不到对应 radio`)
        }

        // 第一个标签带 is-active，面板带 data-label（打印时用）
        assert.match(html, /<label for="[^"]+" class="is-active">C\+\+<\/label>/)
        assert.ok(html.includes('data-label="C++"') && html.includes('data-label="Python"'))
        assert.equal(diag.filter(d => d.level === 'error').length, 0)
    })

    it('面板里仍是完整代码块（高亮 + 行号 + 复制按钮）', () => {
        const { html } = render(pair)
        assert.ok(html.includes('line-numbers-mode'), '应保留行号列')
        assert.ok(html.includes('markdown-it-code-copy'), '应保留复制按钮')
        assert.ok(html.includes('language-cpp'), 'cpp 应被高亮')
        assert.ok(html.includes('language-python'), 'python 应被高亮')
    })

    it('没有 [组名:标签] 的 fence 保持普通代码块', () => {
        const { html } = render('```cpp\nint a;\n```\n')
        assert.ok(!html.includes('code-tabs'), '普通代码块不应被包成标签页')
        assert.ok(html.includes('line-numbers-mode'))
    })

    it('标签为空时忽略标记，不生成标签页', () => {
        const { html } = render('```cpp [g1:]\nint a;\n```\n')
        assert.ok(!html.includes('code-tabs'), '空标签应退化成普通代码块')
    })

    it('分组名不同则各自成组', () => {
        const tpl = [
            '```cpp [g1:C++]', 'a', '```',
            '```py [g2:Python]', 'b', '```',
            '',
        ].join('\n')
        const { html } = render(tpl)
        assert.equal((html.match(/class="code-tabs"/g) || []).length, 2, '两个分组应各自成组')
        assert.equal((html.match(/class="code-tabs-pane"/g) || []).length, 2)
    })

    it('被段落隔开的同组 fence 不合并', () => {
        const tpl = [
            '```cpp [g1:C++]', 'a', '```',
            '',
            '中间说明文字。',
            '',
            '```py [g1:Python]', 'b', '```',
            '',
        ].join('\n')
        const { html } = render(tpl)
        assert.equal((html.match(/class="code-tabs"/g) || []).length, 2, '不相邻不应合并成一组')
    })

    it('同一页多组的 id 不冲突（用段落隔开两组）', () => {
        const tpl = [
            '```cpp [g1:C++]', 'a', '```',
            '```py [g1:Python]', 'b', '```',
            '',
            '第二组：',
            '',
            '```cpp [g1:C++]', 'c', '```',
            '```py [g1:Python]', 'd', '```',
            '',
        ].join('\n')
        const { html } = render(tpl)
        const ids = [...html.matchAll(/id="(code-tabs-[^"]+)"/g)].map(m => m[1])
        assert.equal(ids.length, 4)
        assert.equal(new Set(ids).size, 4, `面板 id 必须唯一，实际: ${ids}`)
        // 两组 radio 的 name 不同，切换互不影响
        const names = [...html.matchAll(/name="(code-tabs-[^"]+)"/g)].map(m => m[1])
        assert.equal(new Set(names).size, 2, `两组应各有自己的 name: ${names}`)
    })

    it('单块成组也输出标签栏（便于逐步补语言）', () => {
        const { html } = render('```cpp [g1:C++]\nint a;\n```\n')
        assert.equal((html.match(/class="code-tabs"/g) || []).length, 1)
        assert.equal((html.match(/class="code-tabs-pane"/g) || []).length, 1)
    })

    it('组内支持 file= 引入代码文件', () => {
        const tpl = [
            '```cpp [g1:C++] file=./sol.cpp', '```',
            '```py [g1:Python]', 'print(1)', '```',
            '',
        ].join('\n')
        const { html, diag } = render(tpl)
        assert.ok(html.includes('#include'), 'file= 的内容应被读入面板')
        assert.ok(!html.includes('file='), 'file= 属性不应泄漏到 class/info 里')
        assert.ok(!html.includes('include-missing'), '不应有 include 失败标记')
        assert.equal(diag.filter(d => d.level === 'error').length, 0)
    })

    it('容错：表格/引用里的 fence 也能成组且不破坏结构', () => {
        const tpl = [
            '> ```cpp [g1:C++]',
            '> int a;',
            '> ```',
            '> ```py [g1:Python]',
            '> b = 1',
            '> ```',
            '',
        ].join('\n')
        const { html } = render(tpl)
        assert.ok(html.includes('code-tabs'), '引用块内的相邻 fence 也应成组')
        assert.ok(html.includes('<blockquote>'))
    })
})

describe('code-tabs：info 解析', () => {
    it('解析组名与标签，并保留语言名与其它属性', () => {
        assert.deepEqual(parseCodeTabsInfo('cpp [g1:C++] file=./a.cpp'), {
            tabs: { group: 'g1', label: 'C++' },
            rest: 'cpp file=./a.cpp',
        })
        assert.deepEqual(parseCodeTabsInfo('py [g2:Python 3]'), {
            tabs: { group: 'g2', label: 'Python 3' },
            rest: 'py',
        })
    })

    it('没有标记时 tabs 为 null', () => {
        assert.equal(parseCodeTabsInfo('cpp').tabs, null)
        assert.equal(parseCodeTabsInfo('').tabs, null)
        assert.equal(parseCodeTabsInfo('cpp [g1]').tabs, null)
        assert.equal(parseCodeTabsInfo('cpp [g1:]').tabs, null)
    })
})

describe('code-tabs：样式契约', () => {
    const css = sass.compile(path.join(PROJECT_ROOT, 'src/markdown-style/markdown.scss')).css
    const codetabsSource = fs.readFileSync(
        path.join(PROJECT_ROOT, 'src/markdown-style/codetabs.scss'), 'utf8')

    it('面板显隐只依赖 input:checked，无需 JS', () => {
        assert.match(css, /\.code-tabs input \+ div\s*\{/, '未选中面板应默认隐藏')
        assert.match(css, /\.code-tabs input:checked \+ div\s*\{/, '选中面板应显示')
    })

    it('打印时展开全部面板并标出标签名', () => {
        assert.match(codetabsSource, /@media print\s*\{/, '应有打印样式')
        assert.match(codetabsSource, /content:\s*attr\(data-label\)/, '打印时应输出 data-label')
        assert.match(codetabsSource, /\.code-tabs-bar\s*\{\s*display:\s*none/, '打印时应收起标签栏')
    })

    it('当前标签有可辨识的选中态（不只靠颜色）', () => {
        assert.match(codetabsSource, /label\.is-active/, 'JS 应能标记当前标签')
        assert.match(codetabsSource, /box-shadow:\s*inset/, '当前标签应有下划线等非颜色标记')
    })
})
