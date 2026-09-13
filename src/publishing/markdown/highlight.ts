import Prism from 'prismjs'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const loadLanguages = require('prismjs/components/')

// Preload commonly used languages in algorithms & programming books
loadLanguages([
    'c',
    'cpp',
    'python',
    'javascript',
    'typescript',
    'bash',
    'java',
    'sql',
    'yaml',
    'json',
    'markdown',
    'css',
])

const LANGUAGE_ALIAS: Record<string, string> = {
    'c++': 'cpp',
    'py': 'python',
    'python3': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'sh': 'bash',
    'shell': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'pascal': 'pascal',
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

export function highlightCode(code: string, rawLang?: string): string {
    const lang = (rawLang || '').trim().toLowerCase().split(/\s+/)[0]
    if (!lang || lang === 'text' || lang === 'plain' || lang === 'plaintext') {
        return `<pre class="language-plaintext"><code class="language-plaintext">${escapeHtml(code)}</code></pre>`
    }

    const resolved = LANGUAGE_ALIAS[lang] || lang

    if (!Prism.languages[resolved]) {
        try {
            loadLanguages([resolved])
        } catch {
            // Language not supported by Prism, fallback to plaintext
        }
    }

    const grammar = Prism.languages[resolved]
    if (grammar) {
        try {
            const highlighted = Prism.highlight(code, grammar, resolved)
            return `<pre class="language-${resolved}"><code class="language-${resolved}">${highlighted}</code></pre>`
        } catch {
            // Highlighting error, fallback
        }
    }

    return `<pre class="language-${lang}"><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
}
