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
        remove: value => values.delete(value),
        contains: value => values.has(value),
        toggle(value, force = !values.has(value)) {
            if (force) values.add(value)
            else values.delete(value)
            return force
        },
    }
}

function page({ store = new Map(), blocked = false, locate = false, mobile = false, currentURL, articleHref, fullTop = null } = {}) {
    const root = { classList: classes(), parentElement: { closest: () => null } }
    const rootButton = eventTarget({ dataset: { directory: '/appendix' }, setAttribute() {}, closest: () => root })
    root.querySelector = () => rootButton
    const group = { classList: classes(), parentElement: { closest: () => root } }
    const button = eventTarget({ dataset: { directory: '/appendix/scripts' }, setAttribute() {}, closest: () => group })
    group.querySelector = () => button
    const other = { classList: classes() }
    const otherButton = eventTarget({ dataset: { directory: '/other' }, setAttribute() {}, closest: () => other })
    const localStore = new Map([['rbook.sidebar.expanded.v1', '["/other"]']])
    let top = 0
    const sidebar = eventTarget({
        classList: classes(),
        getBoundingClientRect: () => ({ top: 0, bottom: 600 }),
        querySelectorAll: selector => selector === '[data-directory]' ? [rootButton, button, otherButton] : [link],
    })
    Object.defineProperty(sidebar, 'scrollTop', {
        get: () => top,
        set: value => { top = Math.max(0, Math.min(value, group.classList.contains('active') ? 2400 : 0)) },
    })
    const link = {
        href: 'https://rbook.test/appendix/compare.html',
        classList: classes(),
        focus(options) { this.focusOptions = options },
        setAttribute() {},
        closest: () => ({ parentElement: { closest: () => group } }),
        getBoundingClientRect: () => ({ top: 1800 - top, bottom: 1834 - top }),
    }
    const frames = []
    const timers = new Map()
    let timerId = 0
    const window = eventTarget({
        scrollX: 0, scrollY: 0,
        matchMedia: () => ({ matches: mobile }),
        scrollTo({ top }) { this.scrollY = top },
    })
    const main = { classList: classes(), scrollTop: fullTop ?? 0, getBoundingClientRect: () => ({ top: -window.scrollY }) }
    if (fullTop !== null) main.classList.add('full-article')
    const locateButton = eventTarget({ hidden: true, dataset: { articleHref } })
    const menuToggle = eventTarget({ setAttribute(name, value) { this[name] = value } })
    const document = {
        querySelector: selector => selector === '.rbook-main' ? main : sidebar,
        getElementById: id => id === 'show-in-menu' && locate ? locateButton : id === 'menu-toggle' ? menuToggle : null,
    }
    vm.runInNewContext(source, {
        window, document, URL,
        location: new URL(currentURL || link.href),
        localStorage: {
            getItem(key) { if (blocked) throw Error('storage denied'); return localStore.get(key) ?? null },
            setItem(key, value) { if (blocked) throw Error('storage denied'); localStore.set(key, value) },
        },
        sessionStorage: {
            getItem(key) { if (blocked) throw Error('storage denied'); return store.get(key) ?? null },
            setItem(key, value) { if (blocked) throw Error('storage denied'); store.set(key, value) },
        },
        requestAnimationFrame: callback => frames.push(callback),
        setTimeout(callback) { timers.set(++timerId, callback); return timerId },
        clearTimeout(id) { timers.delete(id) },
    })
    return {
        sidebar, window, link, store, localStore, root, group, other, button, rootButton, main, locateButton, menuToggle,
        flush() { while (frames.length) frames.shift()() },
        expireEmphasis() { for (const callback of timers.values()) callback(); timers.clear() },
    }
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

it('手动折叠后，定位重新展开整条路径，保留其他目录并保存居中位置', () => {
    const p = page({ locate: true })
    assert.equal(p.locateButton.hidden, false)
    p.button.dispatch('click')
    p.rootButton.dispatch('click')
    p.sidebar.scrollTop = 0
    p.window.scrollY = 420
    p.locateButton.dispatch('click')
    assert.ok(p.root.classList.contains('active'))
    assert.ok(p.group.classList.contains('active'))
    assert.ok(p.other.classList.contains('active'))
    assert.deepEqual(JSON.parse(p.localStore.get('rbook.sidebar.expanded.v1')).sort(), ['/appendix', '/appendix/scripts', '/other'])
    const item = p.link.getBoundingClientRect()
    assert.equal((item.top + item.bottom) / 2, 300)
    assert.equal(Number(p.store.get(SCROLL_KEY)), p.sidebar.scrollTop)
    assert.equal(p.window.scrollY, 420)
    assert.equal(p.link.focusOptions.preventScroll, true)
    assert.ok(p.link.classList.contains('is-located'))
    p.expireEmphasis()
    assert.equal(p.link.classList.contains('is-located'), false)
    assert.ok(p.link.classList.contains('active'))
})

it('手机定位打开菜单，全屏定位退出全屏并沿用正文的阅读位置', () => {
    const p = page({ locate: true, mobile: true, fullTop: 840 })
    p.locateButton.dispatch('click')
    assert.ok(p.sidebar.classList.contains('active'))
    assert.equal(p.menuToggle['aria-expanded'], 'true')
    assert.equal(p.main.classList.contains('full-article'), false)
    assert.equal(p.window.scrollY, 840)
})

it('文章查询参数和锚点不妨碍定位；目录外页面隐藏按钮；禁用存储仍可定位', () => {
    assert.equal(page({ locate: true, currentURL: 'https://rbook.test/appendix/compare.html?from=search#code' }).locateButton.hidden, false)
    assert.equal(page({ locate: true, currentURL: 'https://rbook.test/hidden.html' }).locateButton.hidden, true)
    const p = page({ locate: true, blocked: true })
    p.locateButton.dispatch('click')
    assert.ok(p.link.classList.contains('is-located'))
})

it('使用文章发布地址识别首页别名，目录外的关联文档仍不显示按钮', () => {
    const home = page({ locate: true, currentURL: 'https://rbook.test/', articleHref: '/appendix/compare.html' })
    assert.equal(home.locateButton.hidden, false)
    home.locateButton.dispatch('click')
    assert.ok(home.link.classList.contains('is-located'))
    const related = page({ locate: true, currentURL: 'https://rbook.test/appendix/teach_plan.html', articleHref: '/appendix/teach_plan.html' })
    assert.equal(related.locateButton.hidden, true)
})
