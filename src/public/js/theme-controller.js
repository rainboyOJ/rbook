(function () {
    const STORAGE_KEY = 'rbook.theme.v1'
    const DARK_QUERY = '(prefers-color-scheme: dark)'
    const THEMES = new Set(['light', 'dark'])
    const root = document.documentElement
    const systemTheme = window.matchMedia?.(DARK_QUERY)

    function readPreference() {
        try {
            const value = localStorage.getItem(STORAGE_KEY)
            return THEMES.has(value) ? value : null
        }
        catch {
            return null
        }
    }

    function resolveTheme(preference = readPreference()) {
        if (THEMES.has(preference)) return preference
        return systemTheme?.matches ? 'dark' : 'light'
    }

    function writePreference(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme)
        }
        catch {
            // The theme still works for this page when storage is unavailable.
        }
    }

    function updateControls(theme) {
        const dark = theme === 'dark'
        const label = dark ? '切换到浅色主题' : '切换到深色主题'
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            button.setAttribute('aria-label', label)
            button.setAttribute('title', label)
            button.setAttribute('aria-pressed', String(dark))
        })
    }

    function updateBrowserChrome(theme) {
        const themeColor = theme === 'dark' ? '#0f172a' : '#f8fafc'
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
    }

    function applyTheme(theme, notify = false) {
        root.dataset.theme = theme
        root.style.colorScheme = theme
        updateBrowserChrome(theme)
        updateControls(theme)
        if (notify) {
            document.dispatchEvent(new CustomEvent('rbook:themechange', {
                detail: { theme },
            }))
        }
    }

    function toggleTheme() {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
        writePreference(next)
        applyTheme(next, true)
    }

    function bindControls() {
        updateControls(root.dataset.theme || resolveTheme())
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            if (button.dataset.themeBound === 'true') return
            button.dataset.themeBound = 'true'
            button.addEventListener('click', toggleTheme)
        })
    }

    applyTheme(resolveTheme())

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindControls, { once: true })
    }
    else {
        bindControls()
    }

    const handleSystemThemeChange = () => {
        if (!readPreference()) applyTheme(resolveTheme(), true)
    }
    if (typeof systemTheme?.addEventListener === 'function') {
        systemTheme.addEventListener('change', handleSystemThemeChange)
    }
    else if (typeof systemTheme?.addListener === 'function') {
        systemTheme.addListener(handleSystemThemeChange)
    }

    window.addEventListener('storage', event => {
        if (event.key === STORAGE_KEY) applyTheme(resolveTheme(), true)
    })
})()
