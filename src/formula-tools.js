import { toBlob } from 'html-to-image'

// 通过 article.js 的事件取得现有复制与提示函数，行内公式仍走原来的路径。
let menu = null
let active = null
let exporting = false

function closeMenu(restoreFocus = false) {
    if (!active) return
    const { formula } = active
    formula.setAttribute('aria-expanded', 'false')
    menu.hidden = true
    active = null
    if (restoreFocus) formula.focus({ preventScroll: true })
}

function positionMenu() {
    if (!active) return
    const rect = active.formula.getBoundingClientRect()
    const gap = 8
    const width = menu.offsetWidth
    const height = menu.offsetHeight
    const viewport = window.visualViewport
    const left = viewport?.offsetLeft || 0
    const top = viewport?.offsetTop || 0
    const right = left + (viewport?.width || window.innerWidth)
    const bottom = top + (viewport?.height || window.innerHeight)
    menu.style.left = Math.max(left + gap, Math.min(rect.left + (rect.width - width) / 2, right - width - gap)) + 'px'
    const below = rect.bottom + gap
    menu.style.top = Math.max(top + gap, Math.min(below + height <= bottom - gap ? below : rect.top - height - gap, bottom - height - gap)) + 'px'
}

function buildMenu() {
    menu = document.createElement('div')
    menu.id = 'rbook-formula-menu'
    menu.className = 'rbook-formula-menu'
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-label', '公式操作')
    menu.hidden = true
    for (const [action, label] of [['latex', '复制 LaTeX'], ['image', '复制图片'], ['zoom', '放大查看']]) {
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.action = action
        button.setAttribute('role', 'menuitem')
        button.textContent = label
        button.addEventListener('click', () => runAction(action))
        menu.appendChild(button)
    }
    menu.addEventListener('keydown', event => {
        const buttons = [...menu.querySelectorAll('button')]
        const index = buttons.indexOf(document.activeElement)
        let next
        if (event.key === 'ArrowDown') next = (index + 1) % buttons.length
        if (event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length
        if (event.key === 'Home') next = 0
        if (event.key === 'End') next = buttons.length - 1
        if (next !== undefined) {
            event.preventDefault()
            buttons[next].focus()
        }
        if (event.key === 'Tab') closeMenu(true)
    })
    document.body.appendChild(menu)
}

function openMenu(detail) {
    const same = active?.formula === detail.formula
    closeMenu()
    if (same) return
    if (!menu) buildMenu()
    active = detail
    active.formula.setAttribute('aria-expanded', 'true')
    menu.hidden = false
    positionMenu()
    menu.querySelector('button').focus({ preventScroll: true })
}

async function renderPng(formula) {
    // 在正文外按原字号铺开，既不受文章 max-width 裁剪，也不带悬停高亮。
    const frame = document.createElement('div')
    frame.className = 'katex-display rbook-formula-export'
    frame.setAttribute('aria-hidden', 'true')
    const clone = formula.cloneNode(true)
    clone.style.fontSize = getComputedStyle(formula).fontSize
    clone.removeAttribute('tabindex')
    clone.removeAttribute('data-formula-actions')
    clone.removeAttribute('aria-controls')
    clone.removeAttribute('aria-expanded')
    clone.removeAttribute('aria-haspopup')
    clone.removeAttribute('role')
    frame.appendChild(clone)
    document.body.appendChild(frame)
    try {
        await document.fonts.ready
        const rect = frame.getBoundingClientRect()
        // 限制超长公式的画布尺寸和总像素数，通常导出 3 倍分辨率。
        const width = Math.ceil(Math.max(rect.width, frame.scrollWidth))
        const height = Math.ceil(Math.max(rect.height, frame.scrollHeight))
        const pixelRatio = Math.min(3, 16384 / Math.max(width, height), Math.sqrt(16000000 / (width * height)))
        const blob = await toBlob(frame, {
            width, height, pixelRatio,
            backgroundColor: '#fff',
            preferredFontFormat: 'woff2',
            // 定位只用于屏幕外测量，导出时必须回到画布原点。
            style: { position: 'static', left: 'auto', top: 'auto', margin: '0' },
            filter: node => !node.classList?.contains('katex-mathml'),
        })
        if (!blob) throw new Error('Empty formula image')
        return blob
    } finally {
        frame.remove()
    }
}

function downloadPng(blob) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'formula.png'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
}

async function copyImage(formula, showToast) {
    if (exporting) {
        showToast('正在生成公式图片，请稍候')
        return
    }
    exporting = true
    showToast('正在生成公式图片…')
    const png = renderPng(formula)
    try {
        try {
            if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Clipboard images unavailable')
            // 在点击调用栈内发起写入，异步图片用 Promise 交给 ClipboardItem，
            // 避免等待字体与导出后失去浏览器要求的用户手势。
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
        } catch (error) {
            const blob = await png
            downloadPng(blob)
            showToast('无法复制图片，已改为下载 PNG')
            return
        }
        showToast('已复制图片')
    } catch (error) {
        showToast('公式图片生成失败，请重试')
        console.error('Failed to export formula', error)
    } finally {
        exporting = false
    }
}

function runAction(action) {
    if (!active) return
    const { formula, copyText, showToast } = active
    closeMenu(true)
    if (action === 'latex') {
        const latex = formula.querySelector('annotation[encoding="application/x-tex"]')?.textContent?.trim()
        if (!latex) return
        copyText(`$$\n${latex}\n$$`)
            .then(() => showToast('已复制 LaTeX'))
            .catch(() => showToast('复制失败'))
    } else if (action === 'image') {
        copyImage(formula, showToast)
    } else if (action === 'zoom') {
        document.dispatchEvent(new CustomEvent('rbook:preview-formula', { detail: { formula } }))
    }
}

document.addEventListener('rbook:formula-menu', event => openMenu(event.detail))
document.addEventListener('pointerdown', event => {
    if (active && !menu.contains(event.target) && !active.formula.contains(event.target)) closeMenu()
}, true)
document.addEventListener('click', event => {
    if (active && !menu.contains(event.target) && !active.formula.contains(event.target)) closeMenu()
}, true)
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
        event.preventDefault()
        closeMenu(true)
        return
    }
    if (event.key !== 'Enter' && event.key !== ' ') return
    const formula = event.target.closest?.('[data-formula-actions]')
    if (!formula) return
    event.preventDefault()
    formula.click()
})
window.addEventListener('resize', () => closeMenu())
document.addEventListener('scroll', event => {
    if (!menu?.contains(event.target)) closeMenu()
}, true)
document.addEventListener('rbook:themechange', () => closeMenu())

for (const formula of document.querySelectorAll('.markdown-body .katex-display > .katex')) {
    if (!formula.querySelector('annotation[encoding="application/x-tex"]')) continue
    formula.setAttribute('data-formula-actions', '')
    formula.setAttribute('tabindex', '0')
    formula.setAttribute('role', 'button')
    formula.setAttribute('aria-haspopup', 'menu')
    formula.setAttribute('aria-controls', 'rbook-formula-menu')
    formula.setAttribute('aria-expanded', 'false')
    formula.setAttribute('aria-label', '公式操作：复制 LaTeX、复制图片或放大查看')
}
