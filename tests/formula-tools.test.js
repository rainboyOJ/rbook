const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

// 图片像素与字体由真实浏览器另行验证。这里验证菜单、用户手势内的写入、
// 导出失败及剪贴板回退，避免给普通 Node 测试增加浏览器依赖。
const source = fs.readFileSync('src/formula-tools.js', 'utf8').replace(/^import .*\n/, '')

function page({ clipboard, render = async () => ({ type: 'image/png' }) } = {}) {
    const listeners = new Map()
    const timers = []
    const downloads = []
    const toasts = []
    const copied = []
    const captures = []
    const writes = []
    let document
    function node(tag) {
        const attrs = new Map()
        const events = new Map()
        const el = {
            tagName: tag.toUpperCase(), style: {}, dataset: {}, children: [], hidden: false,
            className: '', textContent: '', offsetWidth: 176, offsetHeight: 140,
            scrollWidth: 3024, scrollHeight: 84,
            classList: { contains: name => el.className.split(' ').includes(name) },
            setAttribute: (name, value) => attrs.set(name, value),
            getAttribute: name => attrs.get(name),
            hasAttribute: name => attrs.has(name),
            removeAttribute: name => attrs.delete(name),
            appendChild(child) { el.children.push(child); child.parentNode = el; return child },
            remove() { el.parentNode.children.splice(el.parentNode.children.indexOf(el), 1) },
            contains(target) { return target === el || el.children.some(child => child.contains(target)) },
            getBoundingClientRect: () => ({ left: 20, top: 20, bottom: 80, width: 3000, height: 60 }),
            focus() { document.activeElement = el },
            closest: selector => selector === '[data-formula-actions]' && el.hasAttribute('data-formula-actions') ? el : null,
            querySelectorAll: selector => el.children.filter(child => selector === 'button' && child.tagName === 'BUTTON'),
            querySelector: selector => selector.startsWith('annotation') ? { textContent: 'x^2' } : el.querySelectorAll(selector)[0],
            cloneNode() { const copy = node(tag); for (const [key, value] of attrs) copy.setAttribute(key, value); return copy },
            addEventListener(name, handler) { events.set(name, handler) },
            click() {
                if (tag === 'a') downloads.push(el.download)
                events.get('click')?.({ target: el })
            },
            keydown(event) { events.get('keydown')?.(event) },
        }
        return el
    }
    const formula = node('span')
    document = {
        activeElement: null, body: node('body'), fonts: { ready: Promise.resolve() },
        createElement: node,
        querySelectorAll: () => [formula],
        addEventListener(name, handler) {
            if (!listeners.has(name)) listeners.set(name, [])
            listeners.get(name).push(handler)
        },
        dispatchEvent(event) { for (const handler of listeners.get(event.type) || []) handler(event) },
    }
    const window = { innerWidth: 390, innerHeight: 844, addEventListener() {} }
    vm.runInNewContext(source, {
        document, window, navigator: { clipboard },
        ClipboardItem: class { constructor(data) { this.data = data; writes.push(data) } },
        CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail } },
        getComputedStyle: () => ({ fontSize: '22px' }),
        toBlob: async (frame, options) => { captures.push({ frame, options }); return render() },
        URL: { createObjectURL: () => 'blob:formula', revokeObjectURL() {} },
        setTimeout: fn => timers.push(fn),
        console: { error() {} },
    })
    const menu = () => document.body.children.find(el => el.className === 'rbook-formula-menu')
    function open() {
        document.dispatchEvent({
            type: 'rbook:formula-menu',
            detail: { formula, copyText: async text => copied.push(text), showToast: text => toasts.push(text) },
        })
    }
    function action(name) { menu().children.find(button => button.dataset.action === name).click() }
    async function settle() { for (let i = 0; i < 15; i++) await Promise.resolve() }
    return { document, formula, open, action, menu, copied, toasts, downloads, captures, writes, settle }
}

it('块级公式可用键盘聚焦，菜单限制在手机视口内，LaTeX 带换行的 $$', async () => {
    const p = page()
    assert.equal(p.formula.getAttribute('aria-haspopup'), 'menu')
    assert.equal(p.formula.getAttribute('tabindex'), '0')
    p.open()
    assert.equal(p.menu().children.length, 3)
    assert.equal(p.formula.getAttribute('aria-expanded'), 'true')
    assert.ok(parseFloat(p.menu().style.left) + p.menu().offsetWidth <= 390)
    p.action('latex')
    await p.settle()
    assert.deepEqual(p.copied, ['$$\nx^2\n$$'])
    assert.equal(p.menu().hidden, true)
    assert.equal(p.document.activeElement, p.formula)
})

it('菜单上下键循环，Esc 关闭并恢复焦点，点击外部收起', () => {
    const p = page()
    p.open()
    p.menu().keydown({ key: 'ArrowUp', preventDefault() {} })
    assert.equal(p.document.activeElement.dataset.action, 'zoom')
    p.document.dispatchEvent({ type: 'keydown', key: 'Escape', preventDefault() {} })
    assert.equal(p.menu().hidden, true)
    assert.equal(p.document.activeElement, p.formula)
    p.open()
    p.menu().keydown({ key: 'Tab' })
    assert.equal(p.menu().hidden, true)
    assert.equal(p.document.activeElement, p.formula)
    p.open()
    p.document.dispatchEvent({ type: 'click', target: p.document.body })
    assert.equal(p.menu().hidden, true)
})

it('放大操作交给现有图片预览器，并传递原公式', () => {
    const p = page()
    let preview
    p.document.addEventListener('rbook:preview-formula', event => { preview = event.detail.formula })
    p.open()
    p.action('zoom')
    assert.equal(preview, p.formula)
    assert.equal(p.menu().hidden, true)
})

it('在用户手势内先写入图片 Promise，白底 PNG 按完整宽度生成且清理离屏节点', async () => {
    let written
    const p = page({ clipboard: { write: async items => { written = items; await items[0].data['image/png'] } } })
    p.open()
    p.action('image')
    assert.equal(written.length, 1, '不能等图片生成完成才请求剪贴板')
    assert.equal(typeof written[0].data['image/png'].then, 'function')
    await p.settle()
    assert.equal(p.captures[0].options.width, 3024)
    assert.equal(p.captures[0].options.backgroundColor, '#fff')
    assert.equal(p.captures[0].options.pixelRatio, 3)
    assert.equal(p.toasts.at(-1), '已复制图片')
    assert.equal(p.document.body.children.some(el => el.className.includes('rbook-formula-export')), false)
    assert.deepEqual(p.downloads, [])
})

it('剪贴板不可用或拒绝写入时，下载同一张 PNG', async () => {
    for (const clipboard of [undefined, { write: async () => { throw Error('denied') } }]) {
        const p = page({ clipboard })
        p.open()
        p.action('image')
        await p.settle()
        assert.deepEqual(p.downloads, ['formula.png'])
        assert.equal(p.toasts.at(-1), '无法复制图片，已改为下载 PNG')
        assert.equal(p.captures.length, 1, '回退时复用同一次生成结果')
    }
})

it('生成失败提示错误而不下载空图片，下一次可重试', async () => {
    let failed = true
    const p = page({ render: async () => { if (failed) throw Error('font failed'); return { type: 'image/png' } } })
    p.open()
    p.action('image')
    await p.settle()
    assert.equal(p.toasts.at(-1), '公式图片生成失败，请重试')
    assert.deepEqual(p.downloads, [])
    failed = false
    p.open()
    p.action('image')
    await p.settle()
    assert.deepEqual(p.downloads, ['formula.png'])
})
