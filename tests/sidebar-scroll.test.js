const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/public/js/site-shell.js'), 'utf8')
const SCROLL_KEY = 'rbook.sidebar.scroll.v1'

function eventTarget(extra = {}) {
    const listeners = new Map()
    return {
        ...extra,
        addEventListener(name, callback) {
            if (!listeners.has(name)) listeners.set(name, [])
            listeners.get(name).push(callback)
        },
        dispatch(name) { for (const callback of listeners.get(name) || []) callback() },
    }
}

function classes() {
    const values = new Set()
    return {
        add: value => values.add(value),
        contains: value => values.has(value),
        toggle(value, force = !values.has(value)) {
            if (force) values.add(value)
            else values.delete(value)
            return force
        },
    }
}

function page({ store = new Map(), blocked = false } = {}) {
    const group = { classList: classes(), parentElement: { closest: () => null } }
    const button = eventTarget({ dataset: { directory: '/appendix/scripts' }, setAttribute() {}, closest: () => group })
    group.querySelector = () => button
    let top = 0
    const sidebar = eventTarget({
        getBoundingClientRect: () => ({ top: 0, bottom: 600 }),
        querySelectorAll: selector => selector === '[data-directory]' ? [button] : [link],
    })
    Object.defineProperty(sidebar, 'scrollTop', {
        get: () => top,
        set: value => { top = Math.max(0, Math.min(value, group.classList.contains('active') ? 2400 : 0)) },
    })
    const link = {
        href: 'https://rbook.test/appendix/compare.html',
        classList: classes(),
        setAttribute() {},
        closest: () => ({ parentElement: { closest: () => group } }),
        getBoundingClientRect: () => ({ top: 1800 - top, bottom: 1834 - top }),
    }
    const frames = []
    const window = eventTarget()
    const document = {
        querySelector: () => sidebar,
        getElementById: () => null,
    }
    vm.runInNewContext(source, {
        window, document, URL,
        location: new URL(link.href),
        localStorage: {
            getItem() { if (blocked) throw Error('storage denied'); return null },
            setItem() { if (blocked) throw Error('storage denied') },
        },
        sessionStorage: {
            getItem(key) { if (blocked) throw Error('storage denied'); return store.get(key) ?? null },
            setItem(key, value) { if (blocked) throw Error('storage denied'); store.set(key, value) },
        },
        requestAnimationFrame: callback => frames.push(callback),
    })
    return { sidebar, window, link, store, flush() { while (frames.length) frames.shift()() } }
}

it('先展开当前文章的父目录，再恢复保存的深层滚动位置', () => {
    const p = page({ store: new Map([[SCROLL_KEY, '1900']]) })
    assert.equal(p.sidebar.scrollTop, 1900)
    assert.equal(p.store.get(SCROLL_KEY), '1900')
})

it('保存的位置为零时保持顶部，不被当前文章的位置覆盖', () => {
    assert.equal(page({ store: new Map([[SCROLL_KEY, '0']]) }).sidebar.scrollTop, 0)
})

it('没有记录时把当前文章移入侧栏可见范围', () => {
    const p = page()
    assert.ok(p.sidebar.scrollTop > 0)
    const rect = p.link.getBoundingClientRect()
    assert.ok(rect.top >= 0 && rect.bottom <= 600)
})

it('快速点击链接时，不等滚动保存帧就同步保存；新页面沿用该位置', () => {
    const p = page()
    p.sidebar.scrollTop = 1700
    p.sidebar.dispatch('scroll')
    p.sidebar.dispatch('click')
    assert.equal(p.store.get(SCROLL_KEY), '1700')
    assert.equal(page({ store: p.store }).sidebar.scrollTop, 1700)
})

it('离开页面时同步保存，刷新及浏览器导航可读取最后的位置', () => {
    const p = page()
    p.sidebar.scrollTop = 1350
    p.window.dispatch('pagehide')
    assert.equal(page({ store: p.store }).sidebar.scrollTop, 1350)
})

it('滚动帧写入当前标签页的存储，各标签页互不覆盖', () => {
    const a = page()
    const b = page()
    a.sidebar.scrollTop = 1000
    b.sidebar.scrollTop = 2000
    a.sidebar.dispatch('scroll')
    b.sidebar.dispatch('scroll')
    a.flush()
    b.flush()
    assert.equal(page({ store: a.store }).sidebar.scrollTop, 1000)
    assert.equal(page({ store: b.store }).sidebar.scrollTop, 2000)
})

it('无效或被禁用的存储不会阻断目录初始化', () => {
    for (const value of ['', '-1', 'NaN', 'Infinity', 'broken']) {
        const p = page({ store: new Map([[SCROLL_KEY, value]]) })
        assert.ok(p.sidebar.scrollTop > 0, value)
    }
    assert.ok(page({ blocked: true }).sidebar.scrollTop > 0)
})
