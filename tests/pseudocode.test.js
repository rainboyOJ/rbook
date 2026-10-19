const { it } = require('node:test')
const assert = require('node:assert/strict')
const { createMarkdownRenderer } = require('../.tsbuild/publishing/markdown/create-markdown-renderer.js')

function renderer() {
    return createMarkdownRenderer({
        index: { byId: new Map(), bySourcePath: new Map(), byPublishHref: new Map(), all: [] },
    })
}

// 保留 SPFA 松弛操作作为独立样例，避免测试依赖文章的后续编辑。
const code = String.raw`\begin{algorithm}
\begin{algorithmic}
\IF{$dis(v) > dis(u) + w(u,v)$ }
\STATE $dis(v) = dis(u)+w(u,v)$
\ENDIF
\end{algorithmic}
\end{algorithm}`
const source = '::: pseudocode\n' + code + '\n:::'

function assertRendered(html) {
    assert.ok(html.includes('class="ps-root"'), '应实际调用伪代码引擎，而不是回退显示源码')
    assert.ok(html.includes('class="ps-keyword"'))
    assert.ok(html.includes('class="ps-linenum"'))
    assert.ok(html.includes('class="katex"'), '伪代码中的数学公式应完成渲染')
    assert.ok(!html.includes('<pre class="pseudocode">'))
    assert.ok(!html.includes('\\begin{algorithm}'))
    assert.ok(!html.includes('<p><div'), '块级渲染结果不应嵌入段落')
}

it('编译后的渲染器能渲染 SPFA 松弛操作的伪代码', () => {
    assertRendered(renderer().render(source))
})

it('pseudocode 代码围栏调用同一引擎并渲染数学公式', () => {
    assertRendered(renderer().render('```pseudocode\n' + code + '\n```'))
})

it('伪代码块紧接普通段落时仍能被识别，结束后继续解析正文', () => {
    const html = renderer().render('前文\n::: pseudocode\n' + code + '\n:::\n\n后文')
    assertRendered(html)
    assert.ok(html.startsWith('<p>前文</p>'))
    assert.ok(html.includes('<p>后文</p>'))
})
