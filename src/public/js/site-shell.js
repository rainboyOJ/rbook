const EXPANDED_KEY = 'rbook.sidebar.expanded.v1'

function readExpanded() {
    try {
        const value = JSON.parse(localStorage.getItem(EXPANDED_KEY) || '[]')
        return new Set(Array.isArray(value) ? value : [])
    }
    catch { return new Set() }
}

function writeExpanded(expanded) {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expanded]))
}

const sidebar = document.querySelector('.rbook-sidebar')
if (sidebar) {
    const expanded = readExpanded()
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
}

document.getElementById('menu-toggle')?.addEventListener('click', () => {
    const open = document.getElementById('sidebar')?.classList.toggle('active')
    document.getElementById('menu-toggle')?.setAttribute('aria-expanded', String(Boolean(open)))
})

document.getElementById('full-button')?.addEventListener('click', () => {
    document.querySelector('.rbook-main')?.classList.toggle('full-article')
})
