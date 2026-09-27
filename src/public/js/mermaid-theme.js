import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs'

const diagrams = [...document.querySelectorAll('.mermaid')]

for (const diagram of diagrams) {
    diagram.dataset.mermaidSource = diagram.textContent || ''
}

let rendering = Promise.resolve()

function renderDiagrams(theme) {
    if (diagrams.length === 0) return Promise.resolve()

    rendering = rendering.then(async () => {
        mermaid.initialize({
            startOnLoad: false,
            theme: theme === 'dark' ? 'dark' : 'default',
        })

        for (const diagram of diagrams) {
            diagram.removeAttribute('data-processed')
            diagram.textContent = diagram.dataset.mermaidSource || ''
        }

        await mermaid.run({ nodes: diagrams })
    }).catch(error => {
        console.error('Failed to render Mermaid diagrams', error)
    })

    return rendering
}

renderDiagrams(document.documentElement.dataset.theme)

document.addEventListener('rbook:themechange', event => {
    renderDiagrams(event.detail?.theme)
})
