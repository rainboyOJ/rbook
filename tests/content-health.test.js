const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')
const fs = require('fs')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { RojJsonProblemProvider, defaultRojJsonPath } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/integrations/roj-json-problem-provider.js'),
)
const { loadCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/catalog-loader.js'))
const { flattenCatalog } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/catalog.js'))
const { resolveArticleSource } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/source-resolver.js'))
const { PathPolicy } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/content/path-policy.js'))

describe('题库 provider 与内容宏健全性', () => {
    const jsonPath = defaultRojJsonPath(PROJECT_ROOT)
    const hasDb = fs.existsSync(jsonPath)

    it('roj.json 存在（否则 [[[p:]]] 全部退化为 missing）', { skip: !hasDb && 'roj.json 不存在' }, () => {
        assert.ok(hasDb, `题库数据缺失: ${jsonPath}`)
    })

    it('provider 能从 roj.json 读到题目', { skip: !hasDb && 'roj.json 不存在' }, () => {
        const provider = new RojJsonProblemProvider({ jsonPath })
        assert.ok(provider.count > 1000, `题目数异常: ${provider.count}`)

        const p = provider.getProblemById('luogu-1048')
        assert.ok(p, '应能查到 luogu-1048')
        assert.equal(p.oj, 'luogu')
        assert.equal(p.sid, '1048')
        assert.ok(p.title.includes('采药'), `标题异常: ${p.title}`)
        assert.ok(p.link.includes('/luogu/1048/'), `链接异常: ${p.link}`)
    })

    it('provider 能标记有题解的题目', { skip: !hasDb && 'roj.json 不存在' }, () => {
        const provider = new RojJsonProblemProvider({ jsonPath })
        assert.ok(provider.hasSolution('roj-1000'), 'roj-1000 应有题解')
    })

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
