const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')

it('自托管字体 CSS 的每个分包均存在、校验通过并能在发布目录相对加载', () => {
    const root = path.resolve(__dirname, '../src/public/fonts/noto-serif-sc')
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')))
    const css = fs.readFileSync(path.join(root, '400.css'), 'utf8')
    const urls = [...css.matchAll(/url\(\.\/([^)]+)\)/g)].map(m => m[1])
    assert.deepEqual(urls.sort(), manifest.files.map(f => f.file).sort())
    for (const file of manifest.files) {
        const bytes = fs.readFileSync(path.join(root, file.file))
        assert.equal(bytes.length, file.bytes, file.file)
        assert.equal(bytes.subarray(0, 4).toString(), 'wOF2', file.file)
        assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.file)
    }
    for (const face of css.split('@font-face').slice(1)) {
        assert.match(face, /font-display: swap/)
        assert.match(face, /unicode-range: U\+/)
    }
    assert.doesNotMatch(css, /https?:|\.woff\)/)
    assert.match(fs.readFileSync(path.join(root, 'LICENSE'), 'utf8'), /SIL OPEN FONT LICENSE/)
    const template = fs.readFileSync(path.resolve(__dirname, '../src/ejs/article.html'), 'utf8')
    assert.ok(template.includes('href="/fonts/noto-serif-sc/400.css"'))
})
