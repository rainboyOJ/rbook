const cleanups = new Map<HTMLElement, Array<() => void>>()

async function mountAnimation(host: HTMLElement): Promise<void> {
    const moduleUrl = host.dataset.animationModule
    if (!moduleUrl || cleanups.has(host)) return

    const shadow = host.attachShadow({ mode: 'open' })
    const root = document.createElement('div')
    root.className = 'rbook-animation-root'
    shadow.append(root)

    const callbacks: Array<() => void> = []
    cleanups.set(host, callbacks)

    try {
        const loaded = await import(moduleUrl)
        const animation = typeof loaded.mount === 'function' ? loaded : loaded.default
        if (!animation || typeof animation.mount !== 'function') {
            throw new Error('动画模块必须导出 mount(context)')
        }
        await animation.mount({
            root,
            onCleanup(callback: () => void) {
                if (typeof callback !== 'function') throw new TypeError('cleanup 必须是函数')
                callbacks.push(callback)
            },
        })
    }
    catch (error) {
        console.error(`Failed to mount animation: ${moduleUrl}`, error)
        root.innerHTML = ''
        const message = document.createElement('p')
        message.setAttribute('role', 'alert')
        message.style.cssText = 'border:1px solid #dc2626;color:#991b1b;padding:12px;border-radius:6px;background:#fef2f2'
        message.textContent = `交互动画加载失败：${error instanceof Error ? error.message : String(error)}`
        root.append(message)
    }
}

export function cleanupAnimations() {
    for (const callbacks of cleanups.values()) {
        for (const callback of callbacks.reverse()) {
            try { callback() }
            catch (error) { console.error('Failed to clean up animation', error) }
        }
    }
    cleanups.clear()
}

export function initAnimations(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('.rbook-animation[data-animation-module]').forEach(mountAnimation)
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initAnimations())
else initAnimations()

window.addEventListener('pagehide', cleanupAnimations, { once: true })
