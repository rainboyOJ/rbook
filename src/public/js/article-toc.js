// 正文中的原生锚点仍是唯一来源；没有脚本时，目录继续在文章内显示。
function mountArticleToc() {
    const main = document.querySelector('.rbook-main')
    const layout = main?.querySelector('.rbook-reading-layout')
    const body = layout?.querySelector('.markdown-body')
    const nav = body?.querySelector('nav.table-of-contents')
    if (!nav) return

    const entries = Array.from(nav.querySelectorAll('a[href^="#"]')).flatMap(link => {
        let id
        try { id = decodeURIComponent(link.hash.slice(1)) }
        catch { return [] }
        const heading = document.getElementById(id)
        if (!heading || !body.contains(heading) || !heading.matches('h2, h3')) return []
        return [{ link, heading, item: link.closest('li') }]
    })
    if (!entries.length) {
        nav.remove()
        return
    }

    const placeholder = document.createComment('article table of contents')
    nav.before(placeholder)
    const rail = document.createElement('aside')
    rail.className = 'rbook-toc-rail'
    const toc = document.createElement('details')
    toc.className = 'rbook-toc'
    const summary = document.createElement('summary')
    summary.textContent = '本文目录'
    const caption = document.createElement('div')
    caption.className = 'rbook-toc-caption'
    caption.textContent = '本文目录'
    caption.setAttribute('aria-hidden', 'true')
    nav.setAttribute('aria-label', '本文目录')
    toc.append(summary, caption, nav)
    layout.append(rail)
    layout.classList.add('has-toc')

    let wide
    let active
    let frame = 0
    let pendingTarget = null
    let pendingTimer = 0
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const scrollRoot = () => main.classList.contains('full-article') ? main : document.scrollingElement
    const viewport = () => main.classList.contains('full-article')
        ? { top: main.getBoundingClientRect().top, height: main.clientHeight }
        : { top: 0, height: window.innerHeight }

    function keepActiveVisible() {
        if (!wide || !active) return
        const box = nav.getBoundingClientRect()
        const link = active.link.getBoundingClientRect()
        if (link.top < box.top) nav.scrollTop -= box.top - link.top + 8
        else if (link.bottom > box.bottom) nav.scrollTop += link.bottom - box.bottom + 8
    }

    function activate(entry) {
        if (active === entry) return
        active = entry
        for (const candidate of entries) {
            const selected = candidate === entry
            candidate.link.classList.toggle('is-active', selected)
            if (selected) candidate.link.setAttribute('aria-current', 'location')
            else candidate.link.removeAttribute('aria-current')
            candidate.item.classList.remove('is-current-section')
        }
        let item = entry.item
        while (item && nav.contains(item)) {
            item.classList.add('is-current-section')
            item = item.parentElement?.closest('li')
        }
        keepActiveVisible()
    }

    function update() {
        frame = 0
        if (pendingTarget) return
        const view = viewport()
        const line = view.top + view.height * 0.25
        let current = entries[0]
        for (const entry of entries) {
            // 折叠容器或隐藏面板中的标题不参与阅读位置判断。
            if (entry.heading.getClientRects().length && entry.heading.getBoundingClientRect().top <= line + 1) current = entry
        }
        const root = scrollRoot()
        if (root.scrollTop > 0 && root.scrollTop + view.height >= root.scrollHeight - 2) {
            current = entries.findLast(entry => entry.heading.getClientRects().length) || current
        }
        activate(current)
    }

    function schedule() {
        if (!frame) frame = requestAnimationFrame(update)
    }

    function adapt() {
        const nextWide = main.clientWidth >= 1040 && CSS.supports('container-type: inline-size')
        if (nextWide !== wide) {
            wide = nextWide
            if (wide) rail.append(toc)
            else placeholder.after(toc)
            toc.open = wide
        }
        schedule()
        keepActiveVisible()
    }

    function releaseTarget() {
        pendingTarget = null
        clearTimeout(pendingTimer)
        schedule()
    }

    function revealHeading(heading) {
        // 目录也可链接到折叠讲解中的小节，先展开其祖先再定位。
        for (let parent = heading.parentElement; parent && parent !== body; parent = parent.parentElement) {
            if (parent.matches('details')) parent.open = true
        }
    }

    function goTo(entry, smooth) {
        revealHeading(entry.heading)
        if (!wide) toc.open = false
        activate(entry)
        const root = scrollRoot()
        const view = viewport()
        const target = Math.max(0, root.scrollTop + entry.heading.getBoundingClientRect().top - view.top - view.height * 0.25)
        pendingTarget = entry
        clearTimeout(pendingTimer)
        root.scrollTo({ top: target, behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant' })
        // 滚动途中保持点击目标高亮；完成或用户主动滚动后恢复阅读跟踪。
        pendingTimer = setTimeout(releaseTarget, smooth && !reducedMotion.matches ? 1400 : 0)
    }

    nav.addEventListener('click', event => {
        const link = event.target.closest('a')
        const entry = entries.find(candidate => candidate.link === link)
        if (!entry || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        const hash = '#' + encodeURIComponent(entry.heading.id)
        if (location.hash !== hash) history.pushState(null, '', hash)
        goTo(entry, true)
        entry.heading.setAttribute('tabindex', '-1')
        entry.heading.focus({ preventScroll: true })
    })

    window.addEventListener('scroll', schedule, { passive: true })
    main.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('scrollend', releaseTarget)
    main.addEventListener('scrollend', releaseTarget)
    window.addEventListener('wheel', releaseTarget, { passive: true })
    window.addEventListener('touchstart', releaseTarget, { passive: true })
    window.addEventListener('keydown', event => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) releaseTarget()
    })
    window.addEventListener('resize', adapt, { passive: true })
    window.addEventListener('hashchange', () => {
        let id
        try { id = decodeURIComponent(location.hash.slice(1)) }
        catch { return }
        const entry = entries.find(candidate => candidate.heading.id === id)
        if (entry) goTo(entry, false)
        else releaseTarget()
    })
    body.addEventListener('toggle', schedule, true)
    toc.addEventListener('toggle', () => { if (wide && !toc.open) toc.open = true })
    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(adapt)
        observer.observe(main)
        observer.observe(body)
    }
    adapt()
    let initialId
    try { initialId = decodeURIComponent(location.hash.slice(1)) }
    catch { initialId = '' }
    const initialHash = entries.find(entry => entry.heading.id === initialId)
    if (initialHash) goTo(initialHash, false)
    window.addEventListener('load', () => {
        if (initialHash) goTo(initialHash, false)
        else schedule()
    }, { once: true })
}

mountArticleToc()
