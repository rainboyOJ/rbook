/*
 * 正文图片放大查看（lightbox）。
 *
 * 交互设计要点（与作者确认过的版本）：
 * - 只接管「块级图」：段落独占图、<figure>、<gallery>、.image-wrapper（excalidraw）、
 *   .rbook-graphviz__canvas 与 .mermaid 里的图。行内小图、被 <a> 包住的图、
 *   加载失败或宽度过小的图一律不碰 —— 前者会给正文到处撒抓手，后者会把跳转
 *   语义偷偷变成弹窗。
 * - <img> 与内联 <svg>（graphviz / mermaid）都支持。SVG 是矢量，所以缩放上限
 *   放到 6 倍，且「100%」取 viewBox 尺寸：一个用户单位对应一个 CSS 像素，
 *   这样百分比在浅色、深色、任意屏宽下都是同一个参照系。
 * - 打开后：适应窗口起步，滚轮/双击以光标为锚点缩放，溢出后拖拽平移，
 *   右下角短暂显示百分比；Esc / 点遮罩空白 / ✕ 关闭，点图片本身不关闭。
 * - <gallery> 内可 ‹ 3 / 5 › 翻页（← → 键，触屏左右滑）。
 * - 无第三方依赖，无 JS 时页面行为完全不变（`zoom-in` 光标由脚本加类才出现）。
 */
(function() {
    'use strict'

    const MIN_WIDTH = 120          // 渲染宽度小于它的图不接管（图标、角标）
    const MAX_SCALE = 3            // <img> 相对原始像素的最大放大倍数
    const MAX_SCALE_SVG = 6        // SVG 是矢量，放大不糊，允许放得更狠
    const FIT_RATIO = 0.92         // 「适应窗口」占视口的比例
    const STAGE_PADDING = 24       // 与 CSS 里 stage 的 padding 保持一致
    const OPEN_MOVE_LIMIT = 6      // 打开判定的位移阈值（px）：超过就算拖动/选字
    const OPEN_TIME_LIMIT = 500    // 打开判定的按压时长（ms）：超过算长按
    const DRAG_LIMIT = 4           // 位移超过它才算拖动，避免手抖变成拖拽
    const SWIPE_LIMIT = 60         // 触屏横向滑动翻页的最小位移（px）
    const WHEEL_FACTOR = 1.15
    const KEY_FACTOR = 1.25
    const SCALE_BADGE_MS = 1500
    const HIDE_DELAY = 160         // 等淡出动画播完再真正 hidden

    // 可以承载「块级图」的容器：这些元素里的图不必再判断是否与文字混排。
    const BLOCK_CONTAINERS = 'figure, gallery, .image-wrapper, .rbook-graphviz__canvas, .mermaid'

    let overlay = null
    let stage = null
    let figure = null
    let media = null               // 当前内容节点：<img> 或克隆出来的 <svg>
    let captionEl = null
    let scaleEl = null
    let pagerEl = null
    let pagerLabel = null
    let prevButton = null
    let nextButton = null
    let closeButton = null

    // 当前预览会话：images 是同一 <gallery> 内的候选条目，index 指向正在看的那张。
    let session = null
    let restoreFocus = null
    let scrollLock = null
    let press = null
    let drag = null
    let pinch = null
    let suppressClick = false
    let scaleTimer = 0
    let hideTimer = 0
    const pointers = new Map()

    function tagOf(node) {
        return node && typeof node.tagName === 'string' ? node.tagName.toLowerCase() : ''
    }

    function num(value) {
        return typeof value === 'number' && Number.isFinite(value) ? value : 0
    }

    function clamp(value, min, max) {
        return value < min ? min : value > max ? max : value
    }

    function rectOf(node) {
        return node && typeof node.getBoundingClientRect === 'function'
            ? node.getBoundingClientRect()
            : null
    }

    function attr(node, name) {
        return node && typeof node.getAttribute === 'function' ? node.getAttribute(name) : null
    }

    function isSvg(node) {
        return tagOf(node) === 'svg'
    }

    // ---- 判定：哪些图可以被放大 ----

    // 加载失败的图不弹：弹出来只是一块空白，比不响应更糟。
    function isBroken(img) {
        if (isSvg(img)) return false
        const rect = rectOf(img)
        return num(img.naturalWidth) === 0 && num(img.naturalHeight) === 0 && num(rect && rect.width) <= 0
    }

    // 图标、角标、行内 emoji 这类小图不接管。优先看渲染宽度（用户看到的才是
    // 真实尺寸），拿不到渲染尺寸时才退回原始宽度。
    function tooSmall(el) {
        const rect = rectOf(el)
        const rendered = num(rect && rect.width)
        if (rendered > 0) return rendered < MIN_WIDTH
        if (isSvg(el)) return true
        const natural = num(el.naturalWidth)
        return natural > 0 && natural < MIN_WIDTH
    }

    function isBlockMedia(el) {
        if (el.closest(BLOCK_CONTAINERS)) return true
        const parent = el.parentNode
        if (!parent) return false
        if (parent.classList && parent.classList.contains('markdown-body')) return true
        // markdown `![](x)` 的产物是 <p><img></p>；段落里除了空白与注释
        // 只有这一张图，才算“独占的块级图”，和文字混排的行内图不接管。
        if (tagOf(parent) !== 'p') return false
        const nodes = parent.childNodes || []
        for (const node of nodes) {
            if (node === el) continue
            if (node.nodeType === 3) {
                if (String(node.textContent).trim()) return false
                continue
            }
            if (node.nodeType === 8) continue
            return false
        }
        return true
    }

    function isEligible(el) {
        if (!el || (tagOf(el) !== 'img' && !isSvg(el))) return false
        // 被链接包住的图保留跳转语义；公式里与按钮里的图形不是插图。
        if (el.closest('a')) return false
        if (el.closest('.katex, .katex-display, button')) return false
        if (overlay && overlay.contains(el)) return false
        if (isBroken(el)) return false
        if (tooSmall(el)) return false
        return isBlockMedia(el)
    }

    // ---- 条目快照 ----
    // 打开那一刻把要展示的东西一次性抓成纯数据：DOM 节点在换图、关闭之后
    // 可能已失效，说明文字也不该在每次翻页时重新去猜。

    function captionOf(el) {
        // SVG 没有 alt，读屏靠 aria-label；图说优先用它。
        const alt = (isSvg(el) ? attr(el, 'aria-label') : attr(el, 'alt')) || ''
        const title = (attr(el, 'title') || '').trim()
        const figureEl = el.closest('figure')
        const figcaption = figureEl && figureEl.querySelector ? figureEl.querySelector('figcaption') : null
        return alt.trim() || title || (figcaption ? String(figcaption.textContent || '').trim() : '')
    }

    // 把 SVG 属性里的长度换算成 CSS 像素。graphviz 导出的常是 `155pt`，
    // 1pt = 4/3 px，直接 parseFloat 会少算 25%，图在预览里比正文里还小。
    // 百分比（mermaid 的 `width="100%"`）返回 0：它不是固定长度，当作 px
    // 会把 100% 当成 100px，图直接被压成一条。这种情形应该交给 viewBox。
    function cssLength(value) {
        const text = String(value || '').trim()
        if (!text) return 0
        if (text.endsWith('%')) return 0
        const amount = parseFloat(text)
        if (!(amount > 0)) return 0
        if (/pt$/i.test(text)) return amount * 4 / 3
        if (/pc$/i.test(text)) return amount * 16
        if (/in$/i.test(text)) return amount * 96
        if (/cm$/i.test(text)) return amount * 96 / 2.54
        if (/mm$/i.test(text)) return amount * 96 / 25.4
        // px 或无单位：按 CSS 像素算。
        return amount
    }

    // SVG 的「100%」取它自己声明的绘制尺寸，而不是 viewBox 的用户单位：
    //   1. graphviz 的 viewBox 单位恰好是 pt，`155pt` 的图 viewBox 只有 155，
    //      拿它当 100% 会让预览里的图比正文里还小 —— 放大功能反而缩小了图。
    //   2. 用户对「100%」的直觉是“和正文里一样大”，而 width/height 正是作者
    //      声明的那个尺寸，与屏宽无关，所以既符合直觉又稳定。
    // 但 mermaid 输出的是 `width="100%"`，没有固定尺寸，此时退到 viewBox：
    // 它给出的 589.76×61 恰好就是正文里的渲染尺寸量级。
    function svgSize(svg) {
        const declared = {
            width: cssLength(attr(svg, 'width')),
            height: cssLength(attr(svg, 'height')),
        }
        if (declared.width > 0 && declared.height > 0) return declared

        const viewBox = svg.viewBox && svg.viewBox.baseVal
        const boxed = { width: num(viewBox && viewBox.width), height: num(viewBox && viewBox.height) }
        if (boxed.width > 0 && boxed.height > 0) {
            // 只有一个维度写了绝对值时，用 viewBox 的比例补齐另一个。
            if (declared.width > 0) return { width: declared.width, height: declared.width * boxed.height / boxed.width }
            if (declared.height > 0) return { width: declared.height * boxed.width / boxed.height, height: declared.height }
            return boxed
        }
        const rect = rectOf(svg)
        return { width: num(rect && rect.width), height: num(rect && rect.height) }
    }

    function snapshot(el) {
        if (isSvg(el)) {
            return {
                kind: 'svg',
                svg: el,
                size: svgSize(el),
                alt: (attr(el, 'aria-label') || '').trim(),
                caption: captionOf(el),
            }
        }
        return {
            kind: 'img',
            src: el.currentSrc || el.src || '',
            alt: (attr(el, 'alt') || '').trim(),
            caption: captionOf(el),
        }
    }

    // 同一 <gallery> 内的图可以翻页；不在 gallery 里的图就是单张。
    function galleryMedias(el) {
        const gallery = el.closest('gallery')
        if (!gallery || typeof gallery.querySelectorAll !== 'function') return [el]
        const list = Array.prototype.slice.call(gallery.querySelectorAll('img, svg'))
            .filter(item => isEligible(item))
        return list.length ? list : [el]
    }

    // ---- 尺寸与变换 ----

    function stageBox() {
        const rect = rectOf(stage)
        let width = rect ? num(rect.width) - STAGE_PADDING * 2 : 0
        let height = rect ? num(rect.height) - STAGE_PADDING * 2 : 0
        if (!(width > 0)) width = num(window.innerWidth) * FIT_RATIO - STAGE_PADDING * 2
        if (!(height > 0)) height = num(window.innerHeight) * FIT_RATIO - STAGE_PADDING * 2
        if (!(width > 0)) width = 640
        if (!(height > 0)) height = 480
        return { width: width, height: height }
    }

    // 适应窗口的比例。位图不允许超过 100%（放大了只是变糊），矢量图则应该
    // 一直放大到装下窗口为止 —— graphviz 的图常常只有 200px 宽，不放大的话
    // 弹出来比正文里还小，完全背离「方便看清细节」的初衷。
    function fitScale(natural, box, allowUpscale) {
        if (!natural.width || !natural.height) return 1
        const ratio = Math.min(box.width / natural.width, box.height / natural.height)
        return allowUpscale ? ratio : Math.min(1, ratio)
    }

    // 当前这一条目的原始尺寸。
    function naturalSize() {
        const entry = session && session.images[session.index]
        if (!entry) return { width: 0, height: 0 }
        if (entry.kind === 'svg') return entry.size
        if (!media) return { width: 0, height: 0 }
        const width = num(media.naturalWidth)
        const height = num(media.naturalHeight)
        if (width > 0 && height > 0) return { width: width, height: height }
        const rect = rectOf(media)
        return { width: num(rect && rect.width), height: num(rect && rect.height) }
    }

    function maxScale() {
        const entry = session && session.images[session.index]
        const base = entry && entry.kind === 'svg' ? MAX_SCALE_SVG : MAX_SCALE
        // 「适应窗口」可能已经超过基准上限（很小的 SVG 填满窗口时可以到几十倍），
        // 上限必须至少包容 fit，否则打开就会被 clamp 成比 fit 还小。
        return Math.max(base, session.fit * 2)
    }

    // 内容按「原始尺寸」铺开，再靠 transform 缩放：这样 100% 就等于原始尺寸，
    // 百分比提示读起来才有意义。返回 false 表示量不到尺寸（还没解码完），
    // 此时不该把图显形。
    function resetFit() {
        if (!session || !media) return false
        const natural = naturalSize()
        if (!natural.width || !natural.height) return false
        const box = stageBox()
        media.style.width = natural.width + 'px'
        media.style.height = natural.height + 'px'
        // 矢量图按实际可用空间放大（图小也能填满窗口）；位图最多到 100%。
        const entry = session.images[session.index]
        session.fit = fitScale(natural, box, entry.kind === 'svg')
        session.scale = session.fit
        session.tx = 0
        session.ty = 0
        apply()
        // 尺寸算好之后才让图露面：否则首次打开大截图时会先画一帧原始尺寸
        // （远超视口、被 stage 裁掉），再跳成适应窗口，闪一下很难看。
        media.style.opacity = '1'
        return true
    }

    function apply() {
        const transform = 'translate(' + session.tx + 'px, ' + session.ty + 'px) scale(' + session.scale + ')'
        figure.style.transform = transform
        showScaleBadge()
    }

    // 平移不越界：图比舞台小就居中不动，比舞台大才允许拖到边。
    function clampPan() {
        const image = rectOf(figure)
        const box = rectOf(stage)
        if (!image || !box) return
        const maxX = Math.max(0, (num(image.width) - num(box.width)) / 2)
        const maxY = Math.max(0, (num(image.height) - num(box.height)) / 2)
        session.tx = clamp(session.tx, -maxX, maxX)
        session.ty = clamp(session.ty, -maxY, maxY)
    }

    // 以光标位置为锚点缩放：锚点下面的那块内容保持不动。
    function zoomAt(nextScale, clientX, clientY) {
        if (!session) return
        const target = clamp(nextScale, session.fit, maxScale())
        if (Math.abs(target - session.scale) < 0.0001) return
        const box = rectOf(stage)
        const centerX = box ? num(box.left) + num(box.width) / 2 : 0
        const centerY = box ? num(box.top) + num(box.height) / 2 : 0
        const vx = num(clientX) - centerX
        const vy = num(clientY) - centerY
        const ratio = target / session.scale
        session.tx = vx - (vx - session.tx) * ratio
        session.ty = vy - (vy - session.ty) * ratio
        session.scale = target
        clampPan()
        apply()
    }

    // 双击在「适应窗口 ↔ 100% 原始尺寸」之间切换；若图本来就小于窗口，
    // 100% 等于适应窗口，那就放大到 2 倍，否则双击会毫无反应。
    function toggleZoom(clientX, clientY) {
        if (!session) return
        const atFit = Math.abs(session.scale - session.fit) < 0.001
        // 双击放大到「原始尺寸」；若 100% 恰好就是适应窗口（小图/矢量图常见），
        // 再翻倍，否则双击会毫无反应。
        const target = atFit ? Math.min(maxScale(), Math.max(1, session.fit * 2)) : session.fit
        if (atFit) zoomAt(target, clientX, clientY)
        else {
            session.scale = target
            session.tx = 0
            session.ty = 0
            apply()
        }
    }

    function showScaleBadge() {
        if (!scaleEl || !session) return
        scaleEl.textContent = Math.round(session.scale * 100) + '%'
        scaleEl.classList.add('is-visible')
        clearTimeout(scaleTimer)
        scaleTimer = setTimeout(function() {
            scaleEl.classList.remove('is-visible')
        }, SCALE_BADGE_MS)
    }

    // ---- 遮罩层 ----

    function buildOverlay() {
        overlay = document.createElement('div')
        overlay.className = 'rbook-image-zoom'
        overlay.setAttribute('role', 'dialog')
        overlay.setAttribute('aria-modal', 'true')
        overlay.setAttribute('aria-label', '图片预览')
        overlay.hidden = true

        stage = document.createElement('div')
        stage.className = 'rbook-image-zoom__stage'

        figure = document.createElement('figure')
        figure.className = 'rbook-image-zoom__figure'

        stage.appendChild(figure)

        captionEl = document.createElement('div')
        captionEl.className = 'rbook-image-zoom__caption'
        captionEl.hidden = true

        scaleEl = document.createElement('div')
        scaleEl.className = 'rbook-image-zoom__scale'
        scaleEl.setAttribute('aria-hidden', 'true')

        closeButton = document.createElement('button')
        closeButton.type = 'button'
        closeButton.className = 'rbook-image-zoom__close'
        closeButton.setAttribute('aria-label', '关闭图片预览')
        closeButton.textContent = '✕'

        pagerEl = document.createElement('div')
        pagerEl.className = 'rbook-image-zoom__pager'
        pagerEl.hidden = true

        prevButton = document.createElement('button')
        prevButton.type = 'button'
        prevButton.className = 'rbook-image-zoom__prev'
        prevButton.setAttribute('aria-label', '上一张图片')
        prevButton.textContent = '‹'

        pagerLabel = document.createElement('span')
        pagerLabel.className = 'rbook-image-zoom__count'

        nextButton = document.createElement('button')
        nextButton.type = 'button'
        nextButton.className = 'rbook-image-zoom__next'
        nextButton.setAttribute('aria-label', '下一张图片')
        nextButton.textContent = '›'

        pagerEl.appendChild(prevButton)
        pagerEl.appendChild(pagerLabel)
        pagerEl.appendChild(nextButton)

        overlay.appendChild(stage)
        overlay.appendChild(captionEl)
        overlay.appendChild(scaleEl)
        overlay.appendChild(pagerEl)
        overlay.appendChild(closeButton)
        document.body.appendChild(overlay)

        closeButton.addEventListener('click', close)
        prevButton.addEventListener('click', function() { step(-1) })
        nextButton.addEventListener('click', function() { step(1) })

        // 点遮罩空白关闭；点图片本身不关闭（放大状态下多半还想看细节）。
        overlay.addEventListener('click', function(event) {
            const target = event.target
            if (figure.contains(target)) {
                suppressClick = false
                return
            }
            if (suppressClick) {
                suppressClick = false
                return
            }
            if (target === overlay || target === stage) close()
        })

        figure.addEventListener('pointerdown', onPointerDown)
        figure.addEventListener('wheel', onWheel, { passive: false })
        figure.addEventListener('dblclick', onDoubleClick)
        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)
        document.addEventListener('pointercancel', onPointerUp)

        // mermaid 在主题切换时会重新渲染正文里的图，但遮罩里是打开那一刻的
        // 克隆体，不会跟着变色。与其让用户盯着一张过期配色的图，不如直接
        // 关掉：退出后正文已是新主题，再点开就是对的。
        document.addEventListener('rbook:themechange', function() {
            if (session) close()
        })
    }

    // 克隆 SVG 进遮罩。刻意不重写 id：graphviz 的内联 SVG 已被构建期加了
    // 唯一前缀，mermaid 的 <style> 又用 `#id .node` 这类选择器命中自己。
    // 改写 id 会让那些选择器失效（图瞬间失去配色），而重复 id 在这里只是
    // 不符合规范、渲染结果正确 —— 两份定义内容完全相同，url(#x) 指向哪份
    // 都一样。
    function cloneSvg(source, size) {
        const clone = source.cloneNode(true)
        clone.style.width = size.width + 'px'
        clone.style.height = size.height + 'px'
        clone.style.maxWidth = 'none'
        clone.style.maxHeight = 'none'
        clone.style.display = 'block'
        clone.style.opacity = '0'
        clone.setAttribute('draggable', 'false')
        // 原始 width/height 可能是 pt 单位，会和 style 里的 px 打架，清掉。
        clone.removeAttribute('width')
        clone.removeAttribute('height')
        return clone
    }

    function mountMedia() {
        const entry = session.images[session.index]
        const wantSvg = entry.kind === 'svg'
        const currentSvg = isSvg(media)

        // <img> 翻页时复用同一个元素，只换 src：文本缓存命中时也仍需一帧
        // 重新解码，重建元素会让图组翻页闪一下。<svg> 克隆体无法“换源”，
        // 换图或两种类型互换时才需要重建。
        if (media && media.parentNode === figure && !wantSvg && !currentSvg) {
            figure.style.transform = ''
            media.style.width = ''
            media.style.height = ''
            media.style.opacity = '0'
            media.setAttribute('alt', entry.alt || '')
            media.src = entry.src
            if (media.complete !== false && num(media.naturalWidth) > 0) resetFit()
            return
        }

        if (media && media.parentNode === figure) figure.removeChild(media)

        if (wantSvg) {
            media = cloneSvg(entry.svg, entry.size)
            figure.appendChild(media)
            // 克隆体是同步生成的，尺寸已知，直接按它定稿。
            if (!resetFit()) media.style.opacity = '1'
            return
        }

        media = document.createElement('img')
        media.className = 'rbook-image-zoom__image'
        media.setAttribute('alt', entry.alt || '')
        media.setAttribute('draggable', 'false')
        // 新图加载完才量得到真实尺寸，所以每次换图都重新算适应比例。
        media.addEventListener('load', function() {
            if (session) resetFit()
        })
        // 加载失败时没有尺寸可按，但至少要把“破图/alt 文字”显出来，
        // 否则用户面对一块空白，比看到错误更让人困惑。
        media.addEventListener('error', function() {
            media.style.opacity = '1'
        })
        figure.appendChild(media)
        media.src = entry.src
        // 缓存命中的图在设置 src 后立刻就有 naturalWidth，不必等 load。
        if (media.complete !== false && num(media.naturalWidth) > 0) resetFit()
    }

    function render() {
        const entry = session.images[session.index]
        if (!entry) return
        figure.style.transform = ''

        if (entry.caption) {
            captionEl.textContent = entry.caption
            captionEl.hidden = false
        }
        else {
            captionEl.textContent = ''
            captionEl.hidden = true
        }

        const multiple = session.images.length > 1
        pagerEl.hidden = !multiple
        overlay.classList.toggle('has-pager', multiple)
        if (multiple) pagerLabel.textContent = (session.index + 1) + ' / ' + session.images.length

        session.fit = 1
        session.scale = 1
        session.tx = 0
        session.ty = 0
        mountMedia()
    }

    function step(direction) {
        if (!session || session.images.length < 2) return
        const total = session.images.length
        session.index = (session.index + direction + total) % total
        render()
    }

    function open(entries, index, sourceEl) {
        if (!overlay) buildOverlay()
        clearTimeout(hideTimer)
        session = {
            images: entries,
            index: index < 0 ? 0 : index,
            fit: 1,
            scale: 1,
            tx: 0,
            ty: 0,
        }
        restoreFocus = sourceEl || null
        lockScroll()
        overlay.hidden = false
        overlay.classList.add('is-open')
        document.documentElement.classList.add('rbook-image-zoom-open')
        render()
        document.addEventListener('keydown', onKeydown, true)
        try {
            closeButton.focus({ preventScroll: true })
        }
        catch (err) {
            // 老浏览器不接受 focus 的选项对象，退化成无参调用即可。
            closeButton.focus()
        }
    }

    function close() {
        if (!session) return
        session = null
        pointers.clear()
        drag = null
        pinch = null
        suppressClick = false
        clearTimeout(scaleTimer)
        document.removeEventListener('keydown', onKeydown, true)
        overlay.classList.remove('is-open')
        document.documentElement.classList.remove('rbook-image-zoom-open')
        // 等淡出动画结束再藏起来；reduced-motion 下 CSS 没有过渡，也无妨。
        clearTimeout(hideTimer)
        hideTimer = setTimeout(function() {
            if (!session) overlay.hidden = true
        }, HIDE_DELAY)
        figure.style.transform = ''
        // 克隆体是每次打开新建的，直接扔掉；下次重新克隆，不会留下旧主题的图。
        if (media && media.parentNode === figure) figure.removeChild(media)
        media = null
        unlockScroll()
        const target = restoreFocus
        restoreFocus = null
        if (target && typeof target.focus === 'function') {
            try {
                target.focus({ preventScroll: true })
            }
            catch (err) {
                target.focus()
            }
        }
    }

    // ---- 滚动锁定 ----
    // 文章页有两种滚动容器：普通页面滚 document，全屏阅读模式滚 .rbook-main。
    // CSS 用 html.rbook-image-zoom-open 一起锁掉，这里只处理滚动条占位跳动。
    function lockScroll() {
        const root = document.documentElement
        const gap = num(window.innerWidth) - num(root.clientWidth)
        scrollLock = {
            bodyOverflow: document.body.style.overflow,
            bodyPadding: document.body.style.paddingRight,
        }
        document.body.style.overflow = 'hidden'
        if (gap > 0) document.body.style.paddingRight = gap + 'px'
    }

    function unlockScroll() {
        if (!scrollLock) return
        document.body.style.overflow = scrollLock.bodyOverflow
        document.body.style.paddingRight = scrollLock.bodyPadding
        scrollLock = null
    }

    // ---- 手势 ----

    function onPointerDown(event) {
        if (!session) return
        if (typeof event.button === 'number' && event.button !== 0) return
        const id = typeof event.pointerId === 'number' ? event.pointerId : 0
        pointers.set(id, { x: num(event.clientX), y: num(event.clientY) })
        if (pointers.size === 1) {
            drag = {
                x: num(event.clientX),
                y: num(event.clientY),
                tx: session.tx,
                ty: session.ty,
                moved: false,
            }
        }
        else if (pointers.size === 2) {
            const points = Array.from(pointers.values())
            pinch = {
                distance: distanceBetween(points[0], points[1]),
                scale: session.scale,
            }
            drag = null
        }
    }

    function distanceBetween(a, b) {
        const dx = a.x - b.x
        const dy = a.y - b.y
        return Math.sqrt(dx * dx + dy * dy)
    }

    function midpoint(points) {
        return {
            x: (points[0].x + points[1].x) / 2,
            y: (points[0].y + points[1].y) / 2,
        }
    }

    function onPointerMove(event) {
        if (!session || pointers.size === 0) return
        const id = typeof event.pointerId === 'number' ? event.pointerId : 0
        if (!pointers.has(id)) return
        pointers.set(id, { x: num(event.clientX), y: num(event.clientY) })

        if (pointers.size >= 2 && pinch) {
            const points = Array.from(pointers.values())
            const distance = distanceBetween(points[0], points[1])
            if (pinch.distance > 0 && distance > 0) {
                const center = midpoint(points)
                zoomAt(pinch.scale * (distance / pinch.distance), center.x, center.y)
            }
            return
        }

        if (!drag) return
        const dx = num(event.clientX) - drag.x
        const dy = num(event.clientY) - drag.y
        if (!drag.moved && Math.abs(dx) < DRAG_LIMIT && Math.abs(dy) < DRAG_LIMIT) return
        drag.moved = true
        session.tx = drag.tx + dx
        session.ty = drag.ty + dy
        clampPan()
        apply()
    }

    function onPointerUp(event) {
        const id = typeof event.pointerId === 'number' ? event.pointerId : 0
        pointers.delete(id)
        if (pointers.size < 2) pinch = null
        // 拖动结束后紧跟一个 click，若不当心会被当成“点空白关闭”。
        if (drag && drag.moved) {
            suppressClick = true
            // 适应窗口状态下没有可平移的余量，横向拖动就是在翻页。
            maybeSwipePage(event)
        }
        if (pointers.size === 0) drag = null
    }

    // 触屏没有 ← → 键：在适应窗口状态下左右划动切图。只在图本来就装得下时
    // 生效，否则会和放大后的平移抢手势。
    function maybeSwipePage(event) {
        if (!session || !drag || session.images.length < 2) return
        if (Math.abs(session.scale - session.fit) > 0.001) return
        const dx = num(event.clientX) - drag.x
        const dy = num(event.clientY) - drag.y
        if (Math.abs(dx) < SWIPE_LIMIT || Math.abs(dx) < Math.abs(dy) * 2) return
        step(dx < 0 ? 1 : -1)
    }

    function onWheel(event) {
        if (!session) return
        event.preventDefault()
        const factor = num(event.deltaY) < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR
        zoomAt(session.scale * factor, event.clientX, event.clientY)
    }

    function onDoubleClick(event) {
        if (!session) return
        event.preventDefault()
        toggleZoom(event.clientX, event.clientY)
    }

    function onKeydown(event) {
        if (!session) return
        const key = event.key
        if (key === 'Escape') {
            event.preventDefault()
            close()
            return
        }
        if (key === 'Tab') {
            // 轻量焦点循环：只有关闭、上一张、下一张三个站得住的可聚焦点。
            const items = [closeButton]
            if (!pagerEl.hidden) items.push(prevButton, nextButton)
            const current = items.indexOf(document.activeElement)
            event.preventDefault()
            const next = event.shiftKey
                ? (current <= 0 ? items.length - 1 : current - 1)
                : (current < 0 || current === items.length - 1 ? 0 : current + 1)
            items[next].focus({ preventScroll: true })
            return
        }
        if (key === 'ArrowLeft' && !pagerEl.hidden) {
            event.preventDefault()
            step(-1)
            return
        }
        if (key === 'ArrowRight' && !pagerEl.hidden) {
            event.preventDefault()
            step(1)
            return
        }
        const box = rectOf(stage)
        const centerX = box ? num(box.left) + num(box.width) / 2 : 0
        const centerY = box ? num(box.top) + num(box.height) / 2 : 0
        if (key === '+' || key === '=') {
            event.preventDefault()
            zoomAt(session.scale * KEY_FACTOR, centerX, centerY)
            return
        }
        if (key === '-' || key === '_') {
            event.preventDefault()
            zoomAt(session.scale / KEY_FACTOR, centerX, centerY)
            return
        }
        if (key === '0') {
            event.preventDefault()
            session.scale = session.fit
            session.tx = 0
            session.ty = 0
            apply()
        }
    }

    // ---- 页面上的点击入口 ----

    // 只给真正可点的图打标记：无 JS 时没有这个类，也就不会有 zoom-in 光标。
    function markMedia() {
        const nodes = document.querySelectorAll('.markdown-body img, .markdown-body svg')
        for (let i = 0; i < nodes.length; i++) {
            const el = nodes[i]
            if (!isEligible(el)) continue
            el.classList.add('rbook-zoomin')
            el.setAttribute('tabindex', '0')
        }
    }

    function openFrom(el) {
        const medias = galleryMedias(el)
        open(medias.map(snapshot), medias.indexOf(el), el)
    }

    // 按下到抬起位移过大或按住太久，说明用户是在拖动浏览、选字或长按，
    // 不该弹出遮罩。
    function pressedLikeClick(event) {
        if (!press) return true
        const dx = num(event.clientX) - press.x
        const dy = num(event.clientY) - press.y
        const moved = Math.sqrt(dx * dx + dy * dy)
        const elapsed = Date.now() - press.time
        return moved <= OPEN_MOVE_LIMIT && elapsed <= OPEN_TIME_LIMIT
    }

    document.addEventListener('pointerdown', function(event) {
        press = { x: num(event.clientX), y: num(event.clientY), time: Date.now() }
    }, true)

    document.addEventListener('click', function(event) {
        const target = event.target
        if (!target || typeof target.closest !== 'function') return
        if (overlay && overlay.contains(target)) return
        // 点 SVG 内部的 <path>/<text> 时向上找到那个 <svg> 本体。
        const media = target.closest('img') || (tagOf(target) === 'svg' ? target : target.closest('svg'))
        if (!media || !isEligible(media)) return
        if (!pressedLikeClick(event)) return
        event.preventDefault()
        openFrom(media)
    }, true)

    // 键盘用户：图进入 Tab 序列后，Enter / Space 与点击等价。
    document.addEventListener('keydown', function(event) {
        if (session) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        const target = event.target
        if (!target || !target.classList || !target.classList.contains('rbook-zoomin')) return
        if (!isEligible(target)) return
        event.preventDefault()
        openFrom(target)
    }, true)

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markMedia)
    }
    else {
        markMedia()
    }

    // 正文里的图可能是异步出现的：mermaid 是逐个把 <pre class="mermaid"> 里的
    // 源码渲染成 <svg>，一次跑完一个，所以“在 load 时扫一遍”会漏掉后渲染的
    // 那几张（实测两个图只能标记上一个）。用一个 MutationObserver 盯住正文
    // 新增节点，比赌某个时间点更可靠。markMedia 是幂等的，重复扫无副作用。
    if (typeof window !== 'undefined' && typeof window.MutationObserver === 'function') {
        let scanning = false
        const observer = new window.MutationObserver(function() {
            // 标记本身会改 class/tabindex，但只改属性不改结构；加个开关纯粹是
            // 为了避免任何意外的回调风暴。
            if (scanning) return
            scanning = true
            try { markMedia() }
            finally { scanning = false }
        })
        const target = document.querySelector('.markdown-body') || document.body
        observer.observe(target, { childList: true, subtree: true })
    }
    else if (typeof window !== 'undefined' && window.addEventListener) {
        // 没有 MutationObserver 时的兵底：load 之后再补两轮。
        window.addEventListener('load', markMedia)
        setTimeout(markMedia, 1000)
    }
})()
