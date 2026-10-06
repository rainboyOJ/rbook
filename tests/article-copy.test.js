const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

function page({ clipboard, tooltipThrows = false, fallback = true } = {}) {
    const classes = new Set()
    const button = {
        textContent: '复制',
        getAttribute: () => 'int main() { return 0; }\n',
        classList: { contains: v => classes.has(v), add: v => classes.add(v), remove: v => classes.delete(v) },
    }
    const copied = []
    let textarea
    const document = {
        activeElement: { focus() {} },
        querySelectorAll: selector => selector.includes('tooltip') ? [{}] : [],
        addEventListener() {},
        createElement: () => (textarea = { style: {}, setAttribute() {}, select() {}, remove() {} }),
        body: { appendChild() {} },
        execCommand: () => { if (fallback) copied.push(textarea.value); return fallback },
    }
    const window = { bootstrap: { Tooltip: function() { if (tooltipThrows) throw Error('tooltip failed') } } }
    vm.runInNewContext(fs.readFileSync('src/public/js/article.js', 'utf8'), {
        document, window, bootstrap: window.bootstrap, navigator: { clipboard },
        setTimeout() {}, console: { error() {}, warn() {} },
    })
    return { window, button, copied }
}

it('提示框异常不影响复制函数注册及代码复制', async () => {
    const copied = []
    const p = page({ tooltipThrows: true, clipboard: { writeText: async text => copied.push(text) } })
    await p.window.myclipboard(p.button)
    assert.deepEqual(copied, ['int main() { return 0; }\n'])
    assert.equal(p.button.textContent, '已复制')
})
it('没有 Clipboard API 时使用备用复制', async () => {
    const p = page()
    await p.window.myclipboard(p.button)
    assert.deepEqual(p.copied, ['int main() { return 0; }\n'])
    assert.equal(p.button.textContent, '已复制')
})
it('Clipboard API 拒绝时使用备用复制', async () => {
    const p = page({ clipboard: { writeText: async () => { throw Error('denied') } } })
    await p.window.myclipboard(p.button)
    assert.equal(p.copied.length, 1)
    assert.equal(p.button.textContent, '已复制')
})
it('复制失败时显示失败且允许重试', async () => {
    const p = page({ fallback: false })
    await p.window.myclipboard(p.button)
    assert.equal(p.button.textContent, '复制失败')
    assert.equal(p.button.classList.contains('copied'), false)
})
