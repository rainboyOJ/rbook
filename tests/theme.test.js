const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const controllerSource = fs.readFileSync(
    path.join(PROJECT_ROOT, 'src/public/js/theme-controller.js'),
    'utf8',
)

function createElement() {
    const attributes = new Map()
    const listeners = new Map()
    return {
        dataset: {},
        style: {},
        setAttribute(name, value) { attributes.set(name, String(value)) },
        getAttribute(name) { return attributes.get(name) || null },
        addEventListener(name, listener) { listeners.set(name, listener) },
        dispatch(name) { listeners.get(name)?.() },
    }
}

function runController({ stored = null, systemDark = false } = {}) {
    const root = createElement()
    const button = createElement()
    const meta = createElement()
    const storedValues = new Map(stored === null ? [] : [['rbook.theme.v1', stored]])
    const documentListeners = new Map()
    const dispatched = []

    const document = {
        documentElement: root,
        readyState: 'complete',
        querySelector(selector) {
            return selector === 'meta[name="theme-color"]' ? meta : null
        },
        querySelectorAll(selector) {
            return selector === '[data-theme-toggle]' ? [button] : []
        },
        addEventListener(name, listener) { documentListeners.set(name, listener) },
        dispatchEvent(event) {
            dispatched.push(event)
            documentListeners.get(event.type)?.(event)
        },
    }

    const mediaListeners = new Map()
    const windowListeners = new Map()
    const window = {
        matchMedia() {
            return {
                matches: systemDark,
                addEventListener(name, listener) { mediaListeners.set(name, listener) },
            }
        },
        addEventListener(name, listener) { windowListeners.set(name, listener) },
    }

    const localStorage = {
        getItem(key) { return storedValues.get(key) || null },
        setItem(key, value) { storedValues.set(key, value) },
    }

    class CustomEvent {
        constructor(type, options) {
            this.type = type
            this.detail = options?.detail
        }
    }

    vm.runInNewContext(controllerSource, {
        window,
        document,
        localStorage,
        CustomEvent,
        Set,
    })

    return { root, button, meta, storedValues, dispatched, mediaListeners, windowListeners }
}

describe('站点主题控制', () => {
    it('没有用户选择时跟随系统深色主题', () => {
        const page = runController({ systemDark: true })

        assert.equal(page.root.dataset.theme, 'dark')
        assert.equal(page.root.style.colorScheme, 'dark')
        assert.equal(page.meta.getAttribute('content'), '#0f172a')
        assert.equal(page.button.getAttribute('aria-label'), '切换到浅色主题')
        assert.equal(page.button.getAttribute('aria-pressed'), 'true')
    })

    it('保存的用户选择优先于系统主题', () => {
        const page = runController({ stored: 'light', systemDark: true })

        assert.equal(page.root.dataset.theme, 'light')
        assert.equal(page.button.getAttribute('aria-label'), '切换到深色主题')
    })

    it('点击切换主题、持久化选择并通知其他渲染器', () => {
        const page = runController({ stored: 'light' })

        page.button.dispatch('click')

        assert.equal(page.root.dataset.theme, 'dark')
        assert.equal(page.storedValues.get('rbook.theme.v1'), 'dark')
        assert.equal(page.dispatched.at(-1).type, 'rbook:themechange')
        assert.equal(page.dispatched.at(-1).detail.theme, 'dark')
    })

    it('非法保存值安全回退到系统主题', () => {
        const page = runController({ stored: 'sepia', systemDark: false })
        assert.equal(page.root.dataset.theme, 'light')
    })

    it('首页和文章页共享早期初始化与主题按钮', () => {
        const head = fs.readFileSync(path.join(PROJECT_ROOT, 'src/component/head.html'), 'utf8')
        const index = fs.readFileSync(path.join(PROJECT_ROOT, 'src/index.html'), 'utf8')
        const article = fs.readFileSync(path.join(PROJECT_ROOT, 'src/ejs/article.html'), 'utf8')
        const toggle = fs.readFileSync(path.join(PROJECT_ROOT, 'src/component/theme-toggle.ejs'), 'utf8')

        assert.match(head, /\/js\/theme-controller\.js/)
        assert.match(index, /theme-toggle\.ejs/)
        assert.match(article, /theme-toggle\.ejs/)
        assert.match(toggle, /data-theme-toggle/)
        assert.match(toggle, /aria-pressed/)
    })

    it('首页和文章样式都引入共享主题令牌', () => {
        const shell = fs.readFileSync(path.join(PROJECT_ROOT, 'src/style/article-shell.scss'), 'utf8')
        const indexStyle = fs.readFileSync(path.join(PROJECT_ROOT, 'src/style.scss'), 'utf8')
        const articleStyle = fs.readFileSync(path.join(PROJECT_ROOT, 'src/markdown-style/markdown.scss'), 'utf8')

        assert.match(shell, /html\[data-theme="dark"\]/)
        assert.match(shell, /--rbook-bg:/)
        assert.match(indexStyle, /style\/article-shell\.scss/)
        assert.match(articleStyle, /\.\.\/style\/article-shell\.scss/)
    })
})
