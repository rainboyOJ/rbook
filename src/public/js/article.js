const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

window.myclipboard = function(btn) {
    const text = btn.getAttribute('data-clipboard-text')
    if (!text || btn.classList.contains('copied')) return
    navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied')
        btn.textContent = '已复制'
        setTimeout(() => {
            btn.textContent = '复制'
            btn.classList.remove('copied')
        }, 1500)
    }).catch(err => {
        console.error('Failed to copy', err)
    })
}

function init_copy(params) {
    // legacy zeroclipboard-container support
    document.querySelectorAll('.zeroclipboard-container').forEach(function(clipContainer) {
        clipContainer.addEventListener('click', function(event) {
            if (clipContainer.classList.contains('copied')) return

            let text = clipContainer.parentNode.parentNode.querySelector('pre > code').textContent
            clipContainer.classList.add('copied')
            try {
                navigator.clipboard.writeText(text).then(() => {
                    setTimeout(() => clipContainer.classList.remove('copied'), 1500)
                })
            }
            catch (err) {
                alert('failed to copy!', err)
            }
        })
    })
}

document.addEventListener('DOMContentLoaded', function() {
    init_copy()
})
