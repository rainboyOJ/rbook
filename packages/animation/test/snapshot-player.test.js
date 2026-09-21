import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

import { createSnapshotPlayer } from '../src/snapshot-player.ts'

class FakeElement {
    constructor(tagName) {
        this.tagName = tagName.toUpperCase()
        this.children = []
        this.listeners = new Map()
        this.attributes = new Map()
        this.disabled = false
        this.parentNode = null
        this.selected = false
        this.textContent = ''
        this.title = ''
        this.value = ''
    }

    append(...children) {
        for (const child of children) {
            child.parentNode = this
            this.children.push(child)
            if (this.tagName === 'SELECT' && child.selected) this.value = child.value
        }
    }

    addEventListener(type, listener) {
        const listeners = this.listeners.get(type) ?? []
        listeners.push(listener)
        this.listeners.set(type, listeners)
    }

    click() {
        if (this.disabled) return
        for (const listener of this.listeners.get('click') ?? []) listener()
    }

    remove() {
        if (!this.parentNode) return
        this.parentNode.children = this.parentNode.children.filter(child => child !== this)
        this.parentNode = null
    }

    setAttribute(name, value) {
        this.attributes.set(name, value)
    }
}

function findByTitle(root, title) {
    const match = root.children.find(child => child.title === title)
    assert.ok(match, `找不到标题为 ${title} 的控件`)
    return match
}

describe('createSnapshotPlayer', () => {
    beforeEach(() => {
        globalThis.document = { createElement: tagName => new FakeElement(tagName) }
        globalThis.window = {
            clearInterval() {},
            setInterval() { return 1 },
        }
    })

    it('创建后立即渲染第一个快照和初始控件状态', () => {
        const root = new FakeElement('div')
        const renders = []

        createSnapshotPlayer({ root, steps: ['first', 'second'], render: (...args) => renders.push(args) })

        assert.deepEqual(renders, [['first', { index: 0, count: 2 }]])
        assert.equal(findByTitle(root.children[1], '上一步').disabled, true)
        assert.equal(findByTitle(root.children[1], '下一步').disabled, false)
    })

    it('可以前进和后退并在边界停住', () => {
        const root = new FakeElement('div')
        const rendered = []
        createSnapshotPlayer({ root, steps: ['a', 'b'], render: step => rendered.push(step) })
        const toolbar = root.children[1]

        findByTitle(toolbar, '下一步').click()
        findByTitle(toolbar, '下一步').click()
        findByTitle(toolbar, '上一步').click()

        assert.deepEqual(rendered, ['a', 'b', 'a'])
    })

    it('replaceSteps 停止旧序列并从新序列的第一步开始', () => {
        const root = new FakeElement('div')
        const rendered = []
        const player = createSnapshotPlayer({ root, steps: [1, 2], render: step => rendered.push(step) })
        findByTitle(root.children[1], '下一步').click()

        player.replaceSteps([10, 20, 30])

        assert.deepEqual(rendered, [1, 2, 10])
        assert.equal(findByTitle(root.children[1], '上一步').disabled, true)
    })

    it('destroy 移除播放器创建的 DOM', () => {
        const root = new FakeElement('div')
        const player = createSnapshotPlayer({ root, steps: ['only'], render() {} })

        player.destroy()

        assert.deepEqual(root.children, [])
    })
})
