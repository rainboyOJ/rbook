const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const sass = require('sass')

const PROJECT_ROOT = path.resolve(__dirname, '..')

describe('发布样式资源', () => {
    it('把伪代码样式内联到 markdown.css，不生成 source-only CSS 请求', () => {
        const result = sass.compile(path.join(PROJECT_ROOT, 'src/markdown-style/markdown.scss'))

        assert.match(result.css, /\.ps-root\s*\{/, 'markdown.css 应包含伪代码样式')
        assert.doesNotMatch(
            result.css,
            /@import\s+["']\.\/markdownPlugin\/pseudocode\.css["']/,
            'markdown.css 不应请求源码目录中的 pseudocode.css',
        )
    })
})
