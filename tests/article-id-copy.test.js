const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

// 文章 ID 胶囊的复制行为：单击复制 ID 原文，弹出与公式复制同一个 .rbook-toast，
// 并让胶囊短暂进入 .is-copied（标签与图标切成「已复制 ✓」）。
function page({ clipboard, id = 'continuous_segment_dp' } = {}) {
    const classes = new Set()
    const listeners = new Map()
    const articleIdButton = {
        getAttribute: name => (name === 'data-article-id' ? id : null),
        classList: {
            contains: v => classes.has(v),
            add: v => classes.add(v),
            remove: v => classes.delete(v),
        },
        addEventListener: (type, handler) => listeners.set(type, handler),
    }

    const toasts = []
    const timers = []
    const document = {
        activeElement: { focus() {} },
        querySelectorAll: selector => (selector === '.rbook-article-id' ? [articleIdButton] : []),
        addEventListener() {},
        createElement: () => {
            const node = { className: '', textContent: '', setAttribute: () => {}, classList: { add: () => {}, remove: () => {} } }
            toasts.push(node)
            return node
        },
        body: { appendChild() {} },
    }

    vm.runInNewContext(fs.readFileSync('src/public/js/article.js', 'utf8'), {
        document,
        window: {},
        navigator: { clipboard },
        setTimeout: (fn, ms) => timers.push({ fn, ms }),
        clearTimeout: () => {},
        console: { error() {}, warn() {} },
    })

    const click = () => listeners.get('click')()
    const flush = () => new Promise(resolve => setImmediate(resolve))
    return { articleIdButton, toasts, timers, click, flush }
}

it('单击文章 ID 胶囊复制 ID 原文并弹出已复制提示', async () => {
    const copied = []
    const p = page({ clipboard: { writeText: async text => copied.push(text) } })
    p.click()
    await p.flush()

    assert.deepEqual(copied, ['continuous_segment_dp'])
    assert.equal(p.toasts.at(-1).textContent, '已复制文章 ID')
    assert.equal(p.articleIdButton.classList.contains('is-copied'), true)
    // toast 自己的 1600ms 隐去计时器之外，还要有一个 1500ms 的胶囊还原计时器。
    assert.ok(p.timers.some(t => t.ms === 1500))
})

it('复制成功后 1.5 秒还原胶囊状态', async () => {
    const p = page({ clipboard: { writeText: async () => {} } })
    p.click()
    await p.flush()
    p.timers.at(-1).fn()
    assert.equal(p.articleIdButton.classList.contains('is-copied'), false)
})

it('复制失败时提示失败且不进入已复制状态', async () => {
    const p = page({
        clipboard: { writeText: async () => { throw Error('denied') } },
    })
    p.click()
    await p.flush()

    assert.equal(p.toasts.at(-1).textContent, '复制失败')
    assert.equal(p.articleIdButton.classList.contains('is-copied'), false)
})

it('已复制状态下重复单击不会重复写剪贴板', async () => {
    const copied = []
    const p = page({ clipboard: { writeText: async text => copied.push(text) } })
    p.click()
    await p.flush()
    p.click()
    await p.flush()

    assert.equal(copied.length, 1)
})
