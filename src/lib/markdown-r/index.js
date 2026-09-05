const MarkdownIt = require('markdown-it')
const fs = require('fs')
const path = require('path')

const md = MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
})

function extractFrontmatter(raw) {
    const lines = raw.split('\n')
    let header = { title: '' }
    let body = raw
    if (lines[0] && lines[0].trim() === '---') {
        const endIdx = lines.indexOf('---', 1)
        if (endIdx > 1) {
            const fmLines = lines.slice(1, endIdx)
            body = lines.slice(endIdx + 1).join('\n')
            for (const line of fmLines) {
                const match = line.match(/^title\s*:\s*(.+)$/i)
                if (match) header.title = match[1].trim()
            }
        }
    }
    return { header, body }
}

function render(raw, config = {}) {
    const { header, body } = extractFrontmatter(raw)
    const env = config.mdit || {}
    if (config.ejs) {
        env.ejs = config.ejs
    }
    const content = md.render(body, env)
    return { header, content }
}

module.exports = { md, render }