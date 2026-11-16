const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

// 正文图片放大（lightbox）的行为契约。用一个最小假 DOM 跑真实的
// src/public/js/image-zoom.js：这个脚本没有任何模块依赖，行为全在 DOM 事件上，
// 所以不值得为了测试引入 jsdom。
const SOURCE = fs.readFileSync(path.join(__dirname, '../src/public/js/image-zoom.js'), 'utf8')

// ---- 最小假 DOM ----

// 支持逗号分隔的简单选择器：tag、.class、tag.class。
function matches(el, selector) {
    if (!el || el.nodeType !== 1) return false
    for (const part of selector.split(',')) {
        const compound = part.trim()
        if (!compound) continue
        const dot = compound.indexOf('.')
        const tag = (dot === -1 ? compound : compound.slice(0, dot)).trim().toLowerCase()
        const classes = dot === -1
            ? []
            : compound.slice(dot).split('.').map(c => c.trim()).filter(Boolean)
        if (tag && tag !== '*' && el.tagName.toLowerCase() !== tag) continue
        if (classes.some(name => !el.classList.contains(name))) continue
        return true
    }
    return false
}

function walk(el, visit) {
    for (const child of el.childNodes) {
        if (child.nodeType !== 1) continue
        visit(child)
        walk(child, visit)
    }
}

function element(tagName, options = {}) {
    const classes = new Set(options.classes || [])
    const attributes = new Map(Object.entries(options.attrs || {}))
    const listeners = new Map()
    const el = {
        nodeType: 1,
        tagName: tagName.toUpperCase(),
        parentNode: null,
        childNodes: [],
        // 浏览器里 style.overflow / style.paddingRight 的默认值就是空串，
        // 脚本靠“读到什么就还原什么”恢复滚动状态，这里要给同样的起点。
        style: { overflow: '', paddingRight: '' },
        hidden: Boolean(options.hidden),
        textContent: options.text || '',
        naturalWidth: options.naturalWidth || 0,
        naturalHeight: options.naturalHeight || 0,
        complete: true,
        width: options.width || 0,
        rect: options.rect || null,
        focused: 0,
        classList: {
            add: value => classes.add(value),
            remove: value => classes.delete(value),
            contains: value => classes.has(value),
            toggle(value, force = !classes.has(value)) {
                if (force) classes.add(value)
                else classes.delete(value)
                return force
            },
        },
        get className() { return [...classes].join(' ') },
        set className(value) {
            classes.clear()
            for (const name of String(value).split(/\s+/)) if (name) classes.add(name)
        },
        getAttribute: name => (attributes.has(name) ? attributes.get(name) : null),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        removeAttribute: name => attributes.delete(name),
        appendChild(child) {
            child.parentNode = el
            el.childNodes.push(child)
            return child
        },
        removeChild(child) {
            const index = el.childNodes.indexOf(child)
            if (index >= 0) el.childNodes.splice(index, 1)
            child.parentNode = null
            return child
        },
        // 只支持本脚本用到的浅克隆场景：SVG 克隆体需要保留 viewBox。
        cloneNode() {
            const copy = element(tagName, { classes: [...classes], attrs: Object.fromEntries(attributes) })
            copy.viewBox = el.viewBox
            return copy
        },
        contains(node) {
            for (let current = node; current; current = current.parentNode) {
                if (current === el) return true
            }
            return false
        },
        closest(selector) {
            for (let current = el; current; current = current.parentNode) {
                if (matches(current, selector)) return current
            }
            return null
        },
        querySelectorAll(selector) {
            const found = []
            walk(el, child => { if (matches(child, selector)) found.push(child) })
            return found
        },
        querySelector(selector) {
            return el.querySelectorAll(selector)[0] || null
        },
        getBoundingClientRect() {
            if (el.rect) return el.rect
            // <img> 与 <svg> 都用构造时给的 width 当作渲染宽度。
            const width = el.tagName === 'IMG' || el.tagName === 'SVG' ? el.width : 0
            return { top: 0, left: 0, width, height: width ? width * 0.75 : 0, right: width, bottom: 0 }
        },        addEventListener(name, handler) {
            if (!listeners.has(name)) listeners.set(name, [])
            listeners.get(name).push(handler)
        },
        dispatch(name, event = {}) {
            for (const handler of listeners.get(name) || []) handler({ target: el, preventDefault() {}, ...event })
        },
        focus() { el.focused += 1 },
    }
    // 浏览器里 img.src 属性赋值等价于 setAttribute('src', ...)，脚本用的正是
    // 属性写法（media.src = entry.src），所以要把它映射回属性表。
    if (tagName.toLowerCase() === 'img') {
        Object.defineProperty(el, 'src', {
            get: () => attributes.get('src') || '',
            set: value => attributes.set('src', String(value)),
            enumerable: true,
        })
    }
    // 浏览器里 viewBox 是 SVGAnimatedRect，脚本读的是 viewBox.baseVal.{width,height}。
    // 真实的 SVG 元素即使没有 viewBox 属性，viewBox.baseVal 也存在，只是宽高为 0。
    if (tagName.toLowerCase() === 'svg') {
        el.viewBox = { baseVal: options.viewBox || { width: 0, height: 0 } }
    }
    return el
}

function text(value) {
    return { nodeType: 3, textContent: value, parentNode: null }
}

// 组装一棵 <div class="markdown-body"> 下的假 DOM。
// blocks: [{parent: 'p'|'figure'|'gallery'|'wrapper'|'link'|'graphviz'|'mermaid', images: [...]}]
// 每个 image spec 里带 viewBox 就造一个内联 <svg>，否则造 <img>。
function page({ blocks = [], stage = { width: 1000, height: 800 } } = {}) {
    const documentListeners = new Map()
    const body = element('body')
    const root = element('html')
    const markdown = element('div', { classes: ['markdown-body'] })
    body.appendChild(markdown)

    const images = []
    for (const block of blocks) {
        let host
        if (block.parent === 'figure') host = element('figure')
        else if (block.parent === 'gallery') host = element('gallery')
        else if (block.parent === 'wrapper') host = element('div', { classes: ['image-wrapper'] })
        else if (block.parent === 'graphviz') host = element('div', { classes: ['rbook-graphviz__canvas'] })
        else if (block.parent === 'mermaid') host = element('pre', { classes: ['mermaid'] })
        else if (block.parent === 'link') host = element('a', { attrs: { href: '/x' } })
        else host = element('p')
        markdown.appendChild(host)

        let container = host
        // 段落里带文字 = 与正文混排的行内图。
        if (block.text) {
            const t = text(block.text)
            t.parentNode = host
            host.childNodes.push(t)
        }
        if (block.parent === 'figure' && block.caption) {
            const cap = element('figcaption', { text: block.caption })
            host.appendChild(cap)
        }

        for (const spec of block.images) {
            // 用 'svg' 标记区分：viewBox 值为 null 也表示“是个 svg，但没有 viewBox”，
            // 这种场景用来验证退回 width/height 属性的分支。
            const isSvgSpec = 'viewBox' in spec
            const img = isSvgSpec
                ? element('svg', {
                    attrs: {
                        ...(spec.ariaLabel ? { 'aria-label': spec.ariaLabel } : {}),
                        ...(spec.attrWidth ? { width: spec.attrWidth } : {}),
                        ...(spec.attrHeight ? { height: spec.attrHeight } : {}),
                    },
                    viewBox: spec.viewBox || null,
                    width: spec.width === undefined ? 600 : spec.width,
                })
                : element('img', {
                    attrs: { src: spec.src, alt: spec.alt || '', ...(spec.title ? { title: spec.title } : {}) },
                    naturalWidth: spec.naturalWidth === undefined ? 800 : spec.naturalWidth,
                    naturalHeight: spec.naturalHeight === undefined ? 600 : spec.naturalHeight,
                    width: spec.width === undefined ? 600 : spec.width,
                })
            container.appendChild(img)
            images.push(img)
        }
    }

    const created = []
    const timers = new Map()
    let timerId = 0
    // 脚本现在会查 'img, svg' 两种选择器，这里按元素类型过滤。
    function selectAll(selector) {
        if (selector === '.markdown-body img, .markdown-body svg') return images
        if (selector === '.markdown-body img') return images.filter(el => el.tagName === 'IMG')
        throw new Error('unexpected selector: ' + selector)
    }
    const document = {
        readyState: 'complete',
        documentElement: root,
        body,
        activeElement: null,
        querySelectorAll: selectAll,
        createElement(tagName) {
            // 放大层里的 <img> 靠 naturalWidth 算缩放比例，先给个可写的空值。
            const el = element(tagName, { rect: stage })
            if (tagName.toLowerCase() === 'img') el.complete = false
            created.push(el)
            return el
        },
        addEventListener(name, handler) {
            if (!documentListeners.has(name)) documentListeners.set(name, [])
            documentListeners.get(name).push(handler)
        },
        removeEventListener(name, handler) {
            const list = documentListeners.get(name) || []
            const index = list.indexOf(handler)
            if (index >= 0) list.splice(index, 1)
        },
        dispatch(name, event) {
            for (const handler of [...(documentListeners.get(name) || [])]) handler(event)
        },
    }

    const window = { innerWidth: 1280, innerHeight: 900 }
    const sandbox = {
        document,
        window,
        navigator: {},
        console: { error() {}, warn() {} },
        Date,
        setTimeout(fn) { timers.set(++timerId, fn); return timerId },
        clearTimeout(id) { timers.delete(id) },
        runTimers() {
            for (const [id, fn] of [...timers]) {
                timers.delete(id)
                fn()
            }
        },
    }
    vm.runInNewContext(SOURCE, sandbox)

    const bySrc = src => images.find(img => img.getAttribute('src') === src)
    const overlay = () => created.find(el => el.classList.contains('rbook-image-zoom'))
    const node = className => created.find(el => el.classList.contains(className))

    function clickImg(img, { x = 100, y = 100, down = null, time = null } = {}) {
        if (down) {
            document.dispatch('pointerdown', { clientX: down.x, clientY: down.y, button: 0, pointerId: 1 })
            if (time !== null) sandbox.Date.now = () => time
        }
        document.dispatch('click', {
            target: img,
            clientX: x,
            clientY: y,
            preventDefault() {},
        })
    }

    return { document, window, sandbox, images, created, body, overlay, node, bySrc, clickImg, markdown }
}

// 打开一张图并按“图片加载完”推进到可断言状态。
function openFirst(p, src, size = { width: 800, height: 600 }) {
    p.clickImg(p.bySrc(src))
    const media = p.node('rbook-image-zoom__image')
    media.naturalWidth = size.width
    media.naturalHeight = size.height
    media.dispatch('load')
    return media
}

// ---- 测试 ----

it('只给正文里的块级图打可放大标记，行内图与链接图不接管', () => {
    const p = page({
        blocks: [
            { parent: 'p', images: [{ src: '/block.png' }] },
            { parent: 'p', text: '混排文字', images: [{ src: '/inline.png' }] },
            { parent: 'link', images: [{ src: '/linked.png' }] },
            { parent: 'p', images: [{ src: '/icon.png', width: 24 }] },
            { parent: 'figure', images: [{ src: '/figure.png', width: 480 }] },
            { parent: 'gallery', images: [{ src: '/g1.png' }, { src: '/g2.png' }] },
            { parent: 'wrapper', images: [{ src: '/excalidraw.png' }] },
        ],
    })

    const marked = p.images.filter(img => img.classList.contains('rbook-zoomin')).map(img => img.getAttribute('src'))
    assert.deepEqual(marked, ['/block.png', '/figure.png', '/g1.png', '/g2.png', '/excalidraw.png'])
    // 可点的图进入 Tab 序列；不可点的不该抢焦点。
    assert.equal(p.bySrc('/block.png').getAttribute('tabindex'), '0')
    assert.equal(p.bySrc('/inline.png').getAttribute('tabindex'), null)
})

it('点击块级图打开遮罩，适应窗口并补全说明文字', () => {
    const p = page({ blocks: [{ parent: 'figure', caption: '建树示意', images: [{ src: '/a.svg', alt: '' }] }] })
    const media = openFirst(p, '/a.svg')

    assert.equal(p.overlay().hidden, false)
    assert.equal(media.getAttribute('src'), '/a.svg')
    // 800×600 的图放进 952×752 的舞台：已经装得下，所以 100% 就是适应窗口。
    assert.equal(media.style.width, '800px')
    assert.match(p.node('rbook-image-zoom__figure').style.transform, /scale\(1\)/)
    // alt 为空时退回 figcaption。
    assert.equal(p.node('rbook-image-zoom__caption').textContent, '建树示意')
    assert.equal(p.document.documentElement.classList.contains('rbook-image-zoom-open'), true)
    assert.equal(p.body.style.overflow, 'hidden')
})

it('大图按舞台缩到适应比例，双击切到原始尺寸', () => {
    const p = page({ blocks: [{ parent: 'p', images: [{ src: '/big.png' }] }] })
    p.clickImg(p.bySrc('/big.png'))
    const media = p.node('rbook-image-zoom__image')
    media.naturalWidth = 2000
    media.naturalHeight = 1000
    media.dispatch('load')

    // 舞台可用区域 952×752：min(1, 952/2000, 752/1000) = 0.476。
    const figure = p.node('rbook-image-zoom__figure')
    const fit = Number(figure.style.transform.match(/scale\(([\d.]+)\)/)[1])
    assert.ok(Math.abs(fit - 952 / 2000) < 0.01, `fit=${fit}`)

    figure.dispatch('dblclick', { clientX: 500, clientY: 400 })
    assert.match(figure.style.transform, /scale\(1\)/)
})

it('Esc 关闭遮罩并把焦点还给原图', () => {
    const p = page({ blocks: [{ parent: 'p', images: [{ src: '/a.png' }] }] })
    const source = p.bySrc('/a.png')
    openFirst(p, '/a.png')
    p.document.dispatch('keydown', { key: 'Escape', preventDefault() {} })

    assert.equal(p.overlay().classList.contains('is-open'), false)
    assert.equal(p.document.documentElement.classList.contains('rbook-image-zoom-open'), false)
    assert.equal(p.body.style.overflow, '')
    assert.equal(source.focused, 1)
})

it('拖动浏览时不出遮罩：位移超过阈值的点击被忽略', () => {
    const p = page({ blocks: [{ parent: 'p', images: [{ src: '/a.png' }] }] })
    const img = p.bySrc('/a.png')
    p.document.dispatch('pointerdown', { clientX: 100, clientY: 100, button: 0, pointerId: 1 })
    p.document.dispatch('click', { target: img, clientX: 140, clientY: 100, preventDefault() {} })
    assert.equal(p.overlay(), undefined)

    // 阈值内的小抖动仍然算点击。
    p.document.dispatch('pointerdown', { clientX: 100, clientY: 100, button: 0, pointerId: 1 })
    p.document.dispatch('click', { target: img, clientX: 102, clientY: 101, preventDefault() {} })
    assert.notEqual(p.overlay(), undefined)
})

it('gallery 内可翻页并在首尾环绕，计数同步更新', () => {
    const p = page({
        blocks: [{ parent: 'gallery', images: [{ src: '/g1.png' }, { src: '/g2.png' }, { src: '/g3.png' }] }],
    })
    const media = openFirst(p, '/g2.png')
    const label = p.node('rbook-image-zoom__count')
    assert.equal(label.textContent, '2 / 3')
    assert.equal(p.node('rbook-image-zoom__pager').hidden, false)

    p.document.dispatch('keydown', { key: 'ArrowRight', preventDefault() {} })
    assert.equal(label.textContent, '3 / 3')
    assert.equal(media.getAttribute('src'), '/g3.png')

    // 尾部的下一张回到第一张。
    p.document.dispatch('keydown', { key: 'ArrowRight', preventDefault() {} })
    assert.equal(label.textContent, '1 / 3')
    assert.equal(media.getAttribute('src'), '/g1.png')

    p.document.dispatch('keydown', { key: 'ArrowLeft', preventDefault() {} })
    assert.equal(label.textContent, '3 / 3')
})

it('单图没有翻页条，左右键不改变图片', () => {
    const p = page({ blocks: [{ parent: 'p', images: [{ src: '/solo.png' }] }] })
    const media = openFirst(p, '/solo.png')
    assert.equal(p.node('rbook-image-zoom__pager').hidden, true)
    assert.equal(p.node('rbook-image-zoom__count').textContent, '')

    p.document.dispatch('keydown', { key: 'ArrowRight', preventDefault() {} })
    assert.equal(media.getAttribute('src'), '/solo.png')
})

it('滚轮缩放不越过原始尺寸，缩回适应窗口后归零平移', () => {
    const p = page({ blocks: [{ parent: 'p', images: [{ src: '/a.png' }] }] })
    p.clickImg(p.bySrc('/a.png'))
    const figure = p.node('rbook-image-zoom__figure')
    const media = p.node('rbook-image-zoom__image')
    media.naturalWidth = 400
    media.naturalHeight = 300
    media.dispatch('load')

    // 400×300 装得下：适应窗口 = 1，滚轮放大被 MAX_SCALE=3 截断。
    for (let i = 0; i < 40; i++) figure.dispatch('wheel', { deltaY: -100, clientX: 500, clientY: 400 })
    const scale = Number(figure.style.transform.match(/scale\(([\d.]+)\)/)[1])
    assert.ok(scale > 1 && scale <= 3.0001, `scale=${scale}`)

    p.document.dispatch('keydown', { key: '0', preventDefault() {} })
    assert.match(figure.style.transform, /scale\(1\)/)
    assert.match(figure.style.transform, /translate\(0px, 0px\)/)
})

// ---- 内联 SVG（graphviz / mermaid） ----

it('graphviz 的内联 SVG 也能接管，其 100% 取声明的绘制尺寸（pt 换算成 px）', () => {
    const p = page({
        blocks: [{
            parent: 'graphviz',
            images: [{ viewBox: { width: 155, height: 231 }, attrWidth: '155pt', attrHeight: '231pt' }],
        }],
    })
    const svg = p.images[0]
    assert.equal(svg.classList.contains('rbook-zoomin'), true)
    assert.equal(svg.getAttribute('tabindex'), '0')

    p.document.dispatch('click', { target: svg, clientX: 10, clientY: 10, preventDefault() {} })
    const clone = p.node('rbook-image-zoom__figure').childNodes[0]
    assert.equal(clone.tagName, 'SVG')
    // 155pt = 155 * 4/3 ≈ 206.67px，这正是浏览器在正文里渲染它的尺寸。
    // 若按 viewBox 的 155 算，预览里的图会比正文里还小 —— 放大功能反而缩小了图。
    assert.ok(Math.abs(parseFloat(clone.style.width) - 155 * 4 / 3) < 0.01, clone.style.width)
    assert.ok(Math.abs(parseFloat(clone.style.height) - 231 * 4 / 3) < 0.01, clone.style.height)
})

it('小 SVG 会放大到填满窗口，而不是缩在中间比正文还小', () => {
    const p = page({
        blocks: [{ parent: 'graphviz', images: [{ viewBox: { width: 155, height: 231 }, attrWidth: '155', attrHeight: '231' }] }],
    })
    p.document.dispatch('click', { target: p.images[0], clientX: 10, clientY: 10, preventDefault() {} })
    const figure = p.node('rbook-image-zoom__figure')
    // 舞台 952×752，155×231 的矢量图适应窗口应该是 min(952/155, 752/231) ≈ 3.25，
    // 而不是被 min(1, …) 压回 1。
    const scale = Number(figure.style.transform.match(/scale\(([\d.]+)\)/)[1])
    assert.ok(scale > 1, `scale=${scale}`)
    assert.ok(Math.abs(scale - Math.min(952 / 155, 752 / 231)) < 0.02, `scale=${scale}`)
})

it('SVG 是矢量，缩放上限比 <img> 更高', () => {
    // 用一张够大的 SVG（800×600，与 <img> 同一量级），避免「适应窗口」本身
    // 就超过基准上限，把要测的 3 倍 vs 6 倍对比搅混。
    const p = page({
        blocks: [{ parent: 'graphviz', images: [{ viewBox: { width: 800, height: 600 }, attrWidth: '800', attrHeight: '600' }] }],
    })
    p.document.dispatch('click', { target: p.images[0], clientX: 10, clientY: 10, preventDefault() {} })
    const figure = p.node('rbook-image-zoom__figure')
    for (let i = 0; i < 60; i++) figure.dispatch('wheel', { deltaY: -100, clientX: 500, clientY: 400 })

    // <img> 上限是 3，SVG 放到 6；这条区分是刻意的：矢量放大不糊，
    // 用位图的 3 倍上限去限制它没有道理。
    const scale = Number(figure.style.transform.match(/scale\(([\d.]+)\)/)[1])
    assert.ok(scale > 3 && scale <= 6.0001, `scale=${scale}`)
})

it('点击 SVG 内部的子节点仍然打开预览，并克隆整个 svg', () => {
    const p = page({
        blocks: [{ parent: 'graphviz', images: [{ viewBox: { width: 200, height: 100 }, ariaLabel: 'Graphviz 图形' }] }],
    })
    const svg = p.images[0]
    const child = element('text')
    svg.appendChild(child)

    // 真实点击落在 <text>/<path> 上，必须向上找到 <svg> 本体。
    p.document.dispatch('click', { target: child, clientX: 10, clientY: 10, preventDefault() {} })
    assert.equal(p.overlay().classList.contains('is-open'), true)
    assert.equal(p.node('rbook-image-zoom__caption').textContent, 'Graphviz 图形')
})

it('mermaid 的 svg 在 <pre class="mermaid"> 里也能接管', () => {
    const p = page({
        blocks: [{ parent: 'mermaid', images: [{ viewBox: { width: 300, height: 150 } }] }],
    })
    assert.equal(p.images[0].classList.contains('rbook-zoomin'), true)
})

it('没有 viewBox 的 svg 仍按 width/height 属性定尺寸，并换算单位', () => {
    const p = page({
        blocks: [{ parent: 'graphviz', images: [{ viewBox: null, attrWidth: '96pt', attrHeight: '100px' }] }],
    })
    // 渲染宽度要够大才不会被当成图标跳过。
    p.images[0].width = 600
    p.document.dispatch('click', { target: p.images[0], clientX: 10, clientY: 10, preventDefault() {} })
    const clone = p.node('rbook-image-zoom__figure').childNodes[0]
    assert.ok(Math.abs(parseFloat(clone.style.width) - 128) < 0.01, clone.style.width)
    assert.equal(parseFloat(clone.style.height), 100)
})

it('SVG 克隆体清掉 width/height 属性，避免 pt 单位与 style 里的 px 打架', () => {
    const p = page({
        blocks: [{ parent: 'graphviz', images: [{ viewBox: { width: 155, height: 231 }, attrWidth: '155pt', attrHeight: '231pt' }] }],
    })
    p.document.dispatch('click', { target: p.images[0], clientX: 10, clientY: 10, preventDefault() {} })
    const clone = p.node('rbook-image-zoom__figure').childNodes[0]
    assert.equal(clone.getAttribute('width'), null)
    assert.equal(clone.getAttribute('height'), null)
    // 但 id 必须保留：graphviz 加了唯一前缀，mermaid 的 <style> 靠 #id 命中节点。
    assert.equal(clone.style.display, 'block')
})

it('切换主题时关掉预览，避免展示旧配色的克隆体', () => {
    const p = page({
        blocks: [{ parent: 'mermaid', images: [{ viewBox: { width: 300, height: 150 } }] }],
    })
    p.document.dispatch('click', { target: p.images[0], clientX: 10, clientY: 10, preventDefault() {} })
    assert.equal(p.overlay().classList.contains('is-open'), true)

    p.document.dispatch('rbook:themechange', { detail: { theme: 'dark' } })
    assert.equal(p.overlay().classList.contains('is-open'), false)
})

it('mermaid 的 width="100%" 不能当成 100px，应退回 viewBox 尺寸', () => {
    const p = page({
        blocks: [{
            parent: 'mermaid',
            images: [{ viewBox: { width: 589.765625, height: 61 }, attrWidth: '100%' }],
        }],
    })
    p.document.dispatch('click', { target: p.images[0], clientX: 10, clientY: 10, preventDefault() {} })
    const clone = p.node('rbook-image-zoom__figure').childNodes[0]
    // 若把 100% 当 100px，图会被压成一条（实测正是这个 bug）。
    assert.ok(Math.abs(parseFloat(clone.style.width) - 589.765625) < 0.01, clone.style.width)
    assert.ok(Math.abs(parseFloat(clone.style.height) - 61) < 0.01, clone.style.height)
})
