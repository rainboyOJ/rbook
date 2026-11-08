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

    // 代码标签页：面板显隐由 CSS（input:checked + div）负责，这里只把当前
    // 标签标成 .is-active，保证没有 JS 时仍然可以切换。
    document.querySelectorAll('.code-tabs').forEach(tabs => {
        const inputs = Array.from(tabs.querySelectorAll('.code-tabs-radio'))
        if (!inputs.length) return
        const labels = Array.from(tabs.querySelectorAll('.code-tabs-bar label'))
        const sync = () => {
            for (const input of inputs) {
                const label = labels.find(l => l.getAttribute('for') === input.id)
                if (label) label.classList.toggle('is-active', input.checked)
            }
        }
        tabs.addEventListener('change', sync)
        sync()
    })

    // 公式复制：点击 KaTeX 公式，复制它的 LaTeX 源码。
    // 源码就存在 KaTeX 隐藏 MathML 的 annotation 里，无需给公式额外打标记。
    let formulaToast = null
    let formulaToastTimer = 0
    // 点击会把选区收成光标，所以必须在 mousedown 时先记住“用户本来选着字”。
    let hadTextSelection = false

    document.addEventListener('mousedown', () => {
        const selection = window.getSelection()
        hadTextSelection = Boolean(selection && !selection.isCollapsed && selection.toString().trim())
    }, true)

    function showToast(message) {
        if (!formulaToast) {
            formulaToast = document.createElement('div')
            formulaToast.className = 'rbook-toast'
            formulaToast.setAttribute('role', 'status')
            formulaToast.setAttribute('aria-live', 'polite')
            document.body.appendChild(formulaToast)
        }
        formulaToast.textContent = message
        formulaToast.classList.add('show')
        clearTimeout(formulaToastTimer)
        formulaToastTimer = setTimeout(() => {
            formulaToast.classList.remove('show')
        }, 1600)
    }

    document.addEventListener('click', event => {
        const target = event.target
        if (!(target instanceof Element)) return

        const katex = target.closest('.katex')
        if (!katex) return

        // 拖选正文时不要抢走这次点击。
        const selection = window.getSelection()
        if (hadTextSelection || (selection && !selection.isCollapsed)) return

        const annotation = katex.querySelector('annotation[encoding="application/x-tex"]')
        const latex = annotation?.textContent?.trim()
        if (!latex) return

        const isDisplay = Boolean(katex.closest('.katex-display'))
        const text = isDisplay ? `$$${latex}$$` : `$${latex}$`
        event.stopPropagation()
        copyText(text)
            .then(() => showToast('已复制 LaTeX'))
            .catch(() => showToast('复制失败'))
    }, true)

    // 文章 ID 胶囊：单击复制文章标识。反馈复用公式复制的 .rbook-toast，
    // 同时给按钮加 .is-copied 让标签和图标短暂切换到「已复制 ✓」。
    document.querySelectorAll('.rbook-article-id').forEach(btn => {
        const id = btn.getAttribute('data-article-id')
        if (!id) return
        let timer = 0
        btn.addEventListener('click', () => {
            if (btn.classList.contains('is-copied')) return
            copyText(id)
                .then(() => {
                    btn.classList.add('is-copied')
                    showToast('已复制文章 ID')
                    clearTimeout(timer)
                    timer = setTimeout(() => btn.classList.remove('is-copied'), 1500)
                })
                .catch(() => showToast('复制失败'))
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
