const EXPANDED_KEY = 'rbook.sidebar.expanded.v1'
const SCROLL_KEY = 'rbook.sidebar.scroll.v1'

function readExpanded() {
    try {
        const value = JSON.parse(localStorage.getItem(EXPANDED_KEY) || '[]')
        return new Set(Array.isArray(value) ? value : [])
    }
    catch { return new Set() }
}

function writeExpanded(expanded) {
    try { localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded])) }
    catch { /* 禁用存储时，目录仍可正常展开和导航。 */ }
}

function readSidebarScroll() {
    try {
        const stored = sessionStorage.getItem(SCROLL_KEY)
        if (stored === null || stored.trim() === '') return null
        const top = Number(stored)
        return Number.isFinite(top) && top >= 0 ? top : null
    }
    catch { return null }
}

const sidebar = document.querySelector('.rbook-sidebar')
if (sidebar) {
    const expanded = readExpanded()
    let currentLink
    sidebar.querySelectorAll('[data-directory]').forEach(button => {
        const directory = button.dataset.directory
        const item = button.closest('li')
        const open = expanded.has(directory)
        item?.classList.toggle('active', open)
        button.setAttribute('aria-expanded', String(open))
        button.addEventListener('click', () => {
            const next = !item.classList.contains('active')
            item.classList.toggle('active', next)
            button.setAttribute('aria-expanded', String(next))
            if (next) expanded.add(directory)
            else expanded.delete(directory)
            writeExpanded(expanded)
        })
    })

    sidebar.querySelectorAll('a.document').forEach(link => {
        const href = new URL(link.href, location.href)
        if (href.pathname === location.pathname && href.search === location.search) {
            currentLink = link
            link.classList.add('active')
            link.setAttribute('aria-current', 'page')
            let parent = link.closest('li')?.parentElement?.closest('li')
            while (parent) {
                const button = parent.querySelector(':scope > .directory')
                const directory = button?.dataset.directory
                parent.classList.add('active')
                button?.setAttribute('aria-expanded', 'true')
                if (directory) expanded.add(directory)
                parent = parent.parentElement?.closest('li')
            }
        }
    })
    writeExpanded(expanded)

    // 先恢复整棵目录的展开状态，再设置 scrollTop，避免被折叠时的高度截断。
    // 使用 sessionStorage，让每个标签页的滚动位置各自独立。
    const savedTop = readSidebarScroll()
    if (savedTop !== null) sidebar.scrollTop = savedTop
    else if (currentLink) {
        // 首次打开深层文章，只移动侧栏；不影响正文和地址锚点的位置。
        const viewport = sidebar.getBoundingClientRect()
        const item = currentLink.getBoundingClientRect()
        if (item.top < viewport.top + 8) sidebar.scrollTop += item.top - viewport.top - 8
        else if (item.bottom > viewport.bottom - 8) sidebar.scrollTop += item.bottom - viewport.bottom + 8
    }

    function saveScroll() {
        try { sessionStorage.setItem(SCROLL_KEY, String(sidebar.scrollTop)) }
        catch { /* 无法保存时，保留本页的正常滚动行为。 */ }
    }

    let saveFrame = 0
    sidebar.addEventListener('scroll', () => {
        if (!saveFrame) saveFrame = requestAnimationFrame(() => {
            saveFrame = 0
            saveScroll()
        })
    }, { passive: true })
    // 导航可能早于下一帧；点击和离开页面时立即保存，也兼容前进/后退缓存。
    sidebar.addEventListener('click', saveScroll, { capture: true })
    sidebar.addEventListener('auxclick', saveScroll, { capture: true })
    window.addEventListener('pagehide', saveScroll)
    saveScroll()
}

document.getElementById('menu-toggle')?.addEventListener('click', () => {
    const open = document.getElementById('sidebar')?.classList.toggle('active')
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', String(Boolean(open)))
})

document.getElementById('full-button')?.addEventListener('click', () => {
    document.querySelector('.rbook-main')?.classList.toggle('full-article')
})
