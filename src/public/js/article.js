(function() {
    function fallbackCopy(text) {
        const activeElement = document.activeElement
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        try {
            textarea.select()
            if (!document.execCommand('copy')) throw new Error('Copy command failed')
        } finally {
            textarea.remove()
            activeElement?.focus({ preventScroll: true })
        }
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text)
                return
            } catch (err) {
                // Browsers may deny clipboard access even on HTTPS pages.
            }
        }
        fallbackCopy(text)
    }

    async function copyButton(btn, text, legacy = false) {
        if (!text || btn.classList.contains('copied') || btn.classList.contains('copying')) return
        const label = btn.textContent
        btn.classList.add('copying')
        try {
            await copyText(text)
            btn.classList.add('copied')
            if (!legacy) btn.textContent = '已复制'
        } catch (err) {
            if (!legacy) btn.textContent = '复制失败'
            console.error('Failed to copy', err)
        } finally {
            btn.classList.remove('copying')
            setTimeout(() => {
                if (!legacy) btn.textContent = label
                btn.classList.remove('copied')
            }, 1500)
        }
    }

    window.myclipboard = function(btn) {
        return copyButton(btn, btn.getAttribute('data-clipboard-text'))
    }

    document.querySelectorAll('.zeroclipboard-container').forEach(clipContainer => {
        clipContainer.addEventListener('click', () => {
            const code = clipContainer.parentNode.parentNode.querySelector('pre > code')
            if (code) copyButton(clipContainer, code.textContent, true)
        })
    })

    // Optional tooltips must never prevent code-copy initialization.
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
        try {
            if (window.bootstrap?.Tooltip) new window.bootstrap.Tooltip(element)
        } catch (err) {
            console.warn('Failed to initialize tooltip', err)
        }
    })
})()
