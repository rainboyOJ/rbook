const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))

describe('文章内容宏健全性', () => {
    it('catalog 文章不含畸形内容宏或缺失的 include 目标', () => {
        const policy = new PathPolicy(PROJECT_ROOT)
        const problems = []

        for (const leaf of flattenCatalog(loadCatalog(path.join(PROJECT_ROOT, 'book', 'catalog.yaml')))) {
            const file = resolveArticleSource(leaf, policy.book, []).source.filePath
            const raw = fs.readFileSync(file, 'utf8')

            // `<% -include` 会被 EJS 当作 scriptlet，输出被静默丢弃
            if (/<% +-/.test(raw)) {
                problems.push(`${leaf}: 畸形内容宏 "<% -"（内容会被静默丢弃）`)
            }

            const re = /include\( *"([^"]+)"/g
            let m
            while ((m = re.exec(raw))) {
                const target = m[1]
                const abs = target.startsWith('/')
                    ? path.join(PROJECT_ROOT, target)
                    : path.join(path.dirname(file), target)
                if (!fs.existsSync(abs)) {
                    problems.push(`${leaf}: include 目标不存在 -> ${target}`)
                }
            }
        }

        assert.deepEqual(problems, [], problems.join('\n'))
    })
})
