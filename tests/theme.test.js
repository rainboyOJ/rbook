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

function runController({ stored = null, systemDark = false, storageUnavailable = false } = {}) {
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
    const mediaQuery = {
        matches: systemDark,
        addEventListener(name, listener) { mediaListeners.set(name, listener) },
    }
    const window = {
        matchMedia() { return mediaQuery },
        addEventListener(name, listener) { windowListeners.set(name, listener) },
    }

    const localStorage = {
        getItem(key) {
            if (storageUnavailable) throw new Error('storage unavailable')
            return storedValues.get(key) || null
        },
        setItem(key, value) {
            if (storageUnavailable) throw new Error('storage unavailable')
            storedValues.set(key, value)
        },
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

    return { root, button, meta, storedValues, dispatched, mediaListeners, windowListeners, mediaQuery }
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

    it('另一标签页更改偏好时同步主题并通知画布，无关存储不触发更新', () => {
        const page = runController({ stored: 'light' })
        page.storedValues.set('rbook.theme.v1', 'dark')
        page.windowListeners.get('storage')({ key: 'unrelated' })
        assert.equal(page.root.dataset.theme, 'light')
        page.windowListeners.get('storage')({ key: 'rbook.theme.v1' })
        assert.equal(page.root.dataset.theme, 'dark')
        assert.equal(page.dispatched.at(-1).detail.theme, 'dark')
    })

    it('未手动选择时响应系统变化，手动选择后保持用户偏好', () => {
        const page = runController()
        page.mediaQuery.matches = true
        page.mediaListeners.get('change')()
        assert.equal(page.root.dataset.theme, 'dark')
        page.button.dispatch('click')
        assert.equal(page.root.dataset.theme, 'light')
        page.mediaListeners.get('change')()
        assert.equal(page.root.dataset.theme, 'light')
        assert.equal(page.storedValues.get('rbook.theme.v1'), 'light')
    })

    it('存储不可用时仍可按系统主题初始化并手动切换', () => {
        const page = runController({ systemDark: true, storageUnavailable: true })
        assert.equal(page.root.dataset.theme, 'dark')
        page.button.dispatch('click')
        assert.equal(page.root.dataset.theme, 'light')
        assert.equal(page.dispatched.at(-1).detail.theme, 'light')
    })

    it('非法保存值安全回退到系统主题', () => {
        const page = runController({ stored: 'sepia', systemDark: false })
        assert.equal(page.root.dataset.theme, 'light')
    })
})
