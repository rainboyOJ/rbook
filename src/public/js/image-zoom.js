/*
 * 正文图片放大查看（lightbox）。
 *
 * 交互设计要点（与作者确认过的版本）：
 * - 只接管「块级图」：段落独占图、<figure>、<gallery>、.image-wrapper（excalidraw）
 *   里的图。行内小图、被 <a> 包住的图、加载失败或宽度过小的图一律不碰 —— 前者
 *   会给正文到处撒抓手，后者会把跳转语义偷偷变成弹窗。
 * - 打开后：适应窗口起步，滚轮/双击以光标为锚点缩放，溢出后拖拽平移，
 *   右下角短暂显示百分比；Esc / 点遮罩空白 / ✕ 关闭，点图片本身不关闭。
 * - <gallery> 内可 ‹ 3 / 5 › 翻页（← → 键，触屏左右滑）。
 * - 无第三方依赖，无 JS 时页面行为完全不变（`zoom-in` 光标由脚本加类才出现）。
 * - 内联 <svg>（graphviz / mermaid）暂不接管，留作第二期。
 */
(function() {
    'use strict'

    const MIN_WIDTH = 120          // 渲染宽度小于它的图不接管（图标、角标）
    const MAX_SCALE = 3            // 相对原始尺寸的最大放大倍数
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

    let overlay = null
    let stage = null
    let figure = null
    let media = null
    let captionEl = null
    let scaleEl = null
    let pagerEl = null
    let pagerLabel = null
    let prevButton = null
    let nextButton = null
    let closeButton = null

    // 当前预览会话：images 是同一 <gallery> 内的候选图，index 指向正在看的那张。
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

    // ---- 判定：哪些图可以被放大 ----

    // 加载失败的图不弹：弹出来只是一块空白，比不响应更糟。
    function isBroken(img) {
        const rect = rectOf(img)
        return num(img.naturalWidth) === 0 && num(img.naturalHeight) === 0 && num(rect && rect.width) <= 0
    }

    // 图标、角标、行内 emoji 这类小图不接管。优先看渲染宽度（用户看到的才是
    // 真实尺寸），拿不到渲染尺寸时才退回原始宽度。
    function tooSmall(img) {
        const rect = rectOf(img)
        const rendered = num(rect && rect.width)
        if (rendered > 0) return rendered < MIN_WIDTH
        const natural = num(img.naturalWidth)
        return natural > 0 && natural < MIN_WIDTH
    }

    function isBlockImage(img) {
        if (img.closest('figure, gallery, .image-wrapper')) return true
        const parent = img.parentNode
        if (!parent) return false
        if (parent.classList && parent.classList.contains('markdown-body')) return true
        // markdown `![](x)` 的产物是 <p><img></p>；段落里除了空白与注释
        // 只有这一张图，才算“独占的块级图”，和文字混排的行内图不接管。
        if (tagOf(parent) !== 'p') return false
        const nodes = parent.childNodes || []
        for (const node of nodes) {
            if (node === img) continue
            if (node.nodeType === 3) {
                if (String(node.textContent).trim()) return false
                continue
            }
            if (node.nodeType === 8) continue
            return false
        }
        return true
    }

    function isEligible(img) {
        if (tagOf(img) !== 'img') return false
        // 被链接包住的图保留跳转语义；公式里的图标不是插图。
        if (img.closest('a')) return false
        if (img.closest('.katex, .katex-display')) return false
        if (overlay && overlay.contains(img)) return false
        if (isBroken(img)) return false
        if (tooSmall(img)) return false
        return isBlockImage(img)
    }

    // 同一 <gallery> 内的图可以翻页；不在 gallery 里的图就是单张。
    function galleryImages(img) {
        const gallery = img.closest('gallery')
        if (!gallery || typeof gallery.querySelectorAll !== 'function') return [img]
        const list = Array.prototype.slice.call(gallery.querySelectorAll('img'))
            .filter(el => tagOf(el) === 'img' && !el.closest('a') && !isBroken(el))
        return list.length ? list : [img]
    }

    function entryOf(img) {
        const alt = (attr(img, 'alt') || '').trim()
        const title = (attr(img, 'title') || '').trim()
        const figureEl = img.closest('figure')
        const captionEl2 = figureEl && figureEl.querySelector ? figureEl.querySelector('figcaption') : null
        const caption = alt || title || (captionEl2 ? String(captionEl2.textContent || '').trim() : '')
        return {
            src: img.currentSrc || img.src || '',
            alt: alt || title,
            caption: caption,
        }
    }

    // ---- 尺寸与变换 ----

    function naturalSize(el) {
        const width = num(el.naturalWidth)
        const height = num(el.naturalHeight)
        if (width > 0 && height > 0) return { width: width, height: height }
        const rect = rectOf(el)
        return { width: num(rect && rect.width), height: num(rect && rect.height) }
    }

    // stage 去掉内边距后的可用区域；量不到时按视口兜底，避免除零。
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

    function fitScale(natural, box) {
        if (!natural.width || !natural.height) return 1
        return Math.min(1, box.width / natural.width, box.height / natural.height)
    }

    // 图片用「原始像素尺寸」铺开，再靠 transform 缩放：
    // 这样 100% 就等于原始尺寸，百分比提示读起来才有意义。
    // 返回 false 表示量不到尺寸（还没解码完），此时不该把图显形。
    function resetFit() {
        if (!session) return false
        const natural = naturalSize(media)
        if (!natural.width || !natural.height) return false
        const box = stageBox()
        media.style.width = natural.width + 'px'
        media.style.height = 'auto'
        session.fit = fitScale(natural, box)
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
        const target = clamp(nextScale, session.fit, MAX_SCALE)
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
        const target = atFit ? Math.max(1, session.fit * 2) : session.fit
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

        media = document.createElement('img')
        media.className = 'rbook-image-zoom__image'
        media.setAttribute('alt', '')
        media.setAttribute('draggable', 'false')

        figure.appendChild(media)
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

        // 新图加载完才量得到真实尺寸，所以每次换图都重新算适应比例。
        media.addEventListener('load', function() {
            if (session) resetFit()
        })
        // 加载失败时没有尺寸可按，但至少要把“破图/alt 文字”显出来，
        // 否则用户面对一块空白，比看到错误更让人困惑。
        media.addEventListener('error', function() {
            media.style.opacity = '1'
        })

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
    }

    function render() {
        const entry = session.images[session.index]
        if (!entry) return
        figure.style.transform = ''
        media.style.width = ''
        media.style.height = ''
        // 配合 resetFit()：尺寸未定之前不显形，避免闪出原始尺寸。
        media.style.opacity = '0'
        media.src = entry.src
        media.setAttribute('alt', entry.alt || '')
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
        // 缓存命中的图在设置 src 后立刻就有 naturalWidth，不必等 load。
        if (media.complete !== false && num(media.naturalWidth) > 0) resetFit()
    }

    function step(direction) {
        if (!session || session.images.length < 2) return
        const total = session.images.length
        session.index = (session.index + direction + total) % total
        render()
    }

    function open(images, index, sourceEl) {
        if (!overlay) buildOverlay()
        clearTimeout(hideTimer)
        session = {
            images: images,
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
        media.style.width = ''
        media.style.height = ''
        // 下次打开时重新走“量尺寸 → 显形”的流程。
        media.style.opacity = '0'
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
    function markImages() {
        const images = document.querySelectorAll('.markdown-body img')
        for (let i = 0; i < images.length; i++) {
            const img = images[i]
            if (!isEligible(img)) continue
            img.classList.add('rbook-zoomin')
            img.setAttribute('tabindex', '0')
        }
    }

    function openFrom(img) {
        const images = galleryImages(img)
        // open() 之后只跟纯数据打交道：DOM 节点在换图、关闭后可能已失效，
        // 说明文字也在打开这一刻一次性抓下来。
        open(images.map(entryOf), images.indexOf(img), img)
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
        const img = target.closest('img')
        if (!img || !isEligible(img)) return
        if (!pressedLikeClick(event)) return
        event.preventDefault()
        openFrom(img)
    }, true)

    // 键盘用户：图片进入 Tab 序列后，Enter / Space 与点击等价。
    document.addEventListener('keydown', function(event) {
        if (session) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        const target = event.target
        if (tagOf(target) !== 'img') return
        if (!target.classList || !target.classList.contains('rbook-zoomin')) return
        if (!isEligible(target)) return
        event.preventDefault()
        openFrom(target)
    }, true)

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', markImages)
    }
    else {
        markImages()
    }
})()
