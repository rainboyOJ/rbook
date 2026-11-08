const EXPANDED_KEY = 'rbook.sidebar.expanded.v1'
const SCROLL_KEY = 'rbook.sidebar.scroll.v1'
const SEARCH_KEY = 'rbook.sidebar.search.v1'

function sidebarSearchTerms(query) {
    return [...new Set(query.trim().toLowerCase().split(/\s+/u).filter(Boolean))]
}

function filterSidebarEntries(entries, query) {
    const terms = sidebarSearchTerms(query)
    if (!terms.length) return []
    return entries.filter(entry => {
        // 菜单名 + 面包屑 + 英文 id + 正文长标题：菜单显示「LIS」时，搜 topsort
        // 或「最长上升子序列」也要能找到同一篇。
        const text = `${entry.title} ${entry.breadcrumb} ${entry.articleId || ''} ${entry.articleTitle || ''}`.toLowerCase()
        return terms.every(term => text.includes(term))
    }).sort((a, b) => {
        const score = entry => {
            const title = entry.title.toLowerCase()
            if (title === terms.join(' ')) return 0
            if (title.startsWith(terms.join(' '))) return 1
            if (terms.every(term => title.includes(term))) return 2
            return 3
        }
        return score(a) - score(b)
    })
}

function readSidebarSearch() {
    try {
        const state = JSON.parse(sessionStorage.getItem(SEARCH_KEY) || 'null')
        if (!state || typeof state.query !== 'string') return null
        return {
            query: state.query,
            top: Number.isFinite(state.top) && state.top >= 0 ? state.top : 0,
        }
    }
    catch { return null }
}

// 使用文本节点构建高亮，关键词中的 HTML、正则字符均只作为普通文字。
function appendSidebarHighlights(element, text, terms) {
    const lower = text.toLowerCase()
    const ranges = []
    for (const term of terms) {
        let start = lower.indexOf(term)
        while (start !== -1) {
            ranges.push([start, start + term.length])
            start = lower.indexOf(term, start + term.length)
        }
    }
    ranges.sort((a, b) => a[0] - b[0])
    const merged = []
    for (const range of ranges) {
        const previous = merged.at(-1)
        if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1])
        else merged.push(range)
    }
    let end = 0
    for (const [start, stop] of merged) {
        element.append(document.createTextNode(text.slice(end, start)))
        const mark = document.createElement('mark')
        mark.textContent = text.slice(start, stop)
        element.append(mark)
        end = stop
    }
    element.append(document.createTextNode(text.slice(end)))
}

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
    const searchBox = document.getElementById('sidebar-search-box')
    const searchInput = document.getElementById('sidebar-search')
    const clearSearch = document.getElementById('sidebar-search-clear')
    const searchStatus = document.getElementById('sidebar-search-status')
    const tree = document.getElementById('sidebar-tree')
    const results = document.getElementById('sidebar-results')
    const hasSearch = searchBox && searchInput && clearSearch && searchStatus && tree && results
    const restoredSearch = hasSearch ? readSidebarSearch() : null
    const restoringSearch = restoredSearch && sidebarSearchTerms(restoredSearch.query).length > 0
    let searching = false
    if (hasSearch) {
        searchBox.hidden = false
        sidebar.classList.add('has-search')
    }
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
            // 搜索期间保持原目录的展开状态，清空后可原样返回。
            let parent = restoringSearch ? null : link.closest('li')?.parentElement?.closest('li')
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
        const visibleTop = hasSearch ? searchBox.getBoundingClientRect().bottom : viewport.top
        if (item.top < visibleTop + 8) sidebar.scrollTop += item.top - visibleTop - 8
        else if (item.bottom > viewport.bottom - 8) sidebar.scrollTop += item.bottom - viewport.bottom + 8
    }

    function saveScroll() {
        try {
            if (searching) sessionStorage.setItem(SEARCH_KEY, JSON.stringify({ query: searchInput.value, top: sidebar.scrollTop }))
            else sessionStorage.setItem(SCROLL_KEY, String(sidebar.scrollTop))
        }
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

    if (hasSearch) {
        const entries = Array.from(tree.querySelectorAll('a.document')).map(link => {
            const names = []
            let parent = link.closest('li')?.parentElement?.closest('li')
            while (parent) {
                const title = parent.querySelector(':scope > .directory .rbook-menu-title')
                if (title) names.unshift(title.textContent.trim())
                parent = parent.parentElement?.closest('li')
            }
            return {
                title: link.querySelector('.rbook-menu-title').textContent.trim(),
                breadcrumb: names.join(' / '),
                articleId: (link.dataset.articleId || '').trim(),
                articleTitle: (link.dataset.articleTitle || '').trim(),
                href: link.href,
                current: link === currentLink,
            }
        })
        let treeTop = sidebar.scrollTop
        let composing = false

        function renderSearch(top = 0) {
            const query = searchInput.value
            const terms = sidebarSearchTerms(query)
            clearSearch.hidden = !query.length
            if (!terms.length) {
                tree.hidden = false
                results.hidden = true
                results.replaceChildren()
                searchStatus.textContent = '搜索文章标题或目录路径'
                if (searching) sidebar.scrollTop = treeTop
                searching = false
                try { sessionStorage.removeItem(SEARCH_KEY) }
                catch { /* 存储被禁用时，搜索仍可使用。 */ }
                saveScroll()
                return
            }
            if (!searching) {
                treeTop = sidebar.scrollTop
                saveScroll()
            }
            searching = true
            tree.hidden = true
            results.hidden = false
            const matches = filterSidebarEntries(entries, query)
            const list = document.createElement('ul')
            for (const entry of matches) {
                const item = document.createElement('li')
                const link = document.createElement('a')
                link.href = entry.href
                link.className = 'item document'
                if (entry.current) {
                    link.classList.add('active')
                    link.setAttribute('aria-current', 'page')
                }
                const title = document.createElement('span')
                title.className = 'rbook-sidebar-result__title'
                appendSidebarHighlights(title, entry.title, terms)
                const path = document.createElement('span')
                path.className = 'rbook-sidebar-result__path'
                appendSidebarHighlights(path, entry.breadcrumb || '首页', terms)
                link.append(title, path)
                item.append(link)
                list.append(item)
            }
            results.replaceChildren(list)
            if (!matches.length) {
                const empty = document.createElement('p')
                empty.className = 'rbook-sidebar-search__empty'
                empty.textContent = '没有找到相关文章，试试更短的关键词或所属目录。'
                results.append(empty)
            }
            searchStatus.textContent = `找到 ${matches.length} 篇文章`
            sidebar.scrollTop = top
            saveScroll()
        }

        function resetSearch() {
            searchInput.value = ''
            renderSearch()
            searchInput.focus({ preventScroll: true })
        }

        function focusResult(link) {
            if (!link) return
            link.focus({ preventScroll: true })
            const item = link.getBoundingClientRect()
            const top = searchBox.getBoundingClientRect().bottom + 8
            const bottom = sidebar.getBoundingClientRect().bottom - 8
            if (item.top < top) sidebar.scrollTop += item.top - top
            else if (item.bottom > bottom) sidebar.scrollTop += item.bottom - bottom
        }

        searchInput.addEventListener('compositionstart', () => { composing = true })
        searchInput.addEventListener('compositionend', () => { composing = false; renderSearch() })
        searchInput.addEventListener('input', event => {
            if (!composing && !event.isComposing) renderSearch()
        })
        searchInput.addEventListener('keydown', event => {
            if (composing || event.isComposing || event.keyCode === 229) return
            if (event.key === 'Escape') {
                event.preventDefault()
                resetSearch()
            }
            else if (event.key === 'ArrowDown' || event.key === 'Enter') {
                const first = results.querySelector('a.document')
                if (!searching || !first) return
                event.preventDefault()
                if (event.key === 'Enter') first.click()
                else focusResult(first)
            }
        })
        clearSearch.addEventListener('click', resetSearch)
        results.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); resetSearch(); return }
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            const links = Array.from(results.querySelectorAll('a.document'))
            const index = links.indexOf(document.activeElement)
            if (index < 0) return
            event.preventDefault()
            if (event.key === 'ArrowUp' && index === 0) searchInput.focus({ preventScroll: true })
            else focusResult(links[Math.min(links.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)))])
        })
        if (restoringSearch) {
            searchInput.value = restoredSearch.query
            renderSearch(restoredSearch.top)
        }
    }
}

document.getElementById('menu-toggle')?.addEventListener('click', () => {
    const open = document.getElementById('sidebar')?.classList.toggle('active')
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', String(Boolean(open)))
})

document.getElementById('full-button')?.addEventListener('click', () => {
    document.querySelector('.rbook-main')?.classList.toggle('full-article')
})
