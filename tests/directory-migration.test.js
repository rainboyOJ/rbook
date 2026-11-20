const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const { loadCatalog } = require('../.tsbuild/publishing/content/catalog-loader')
const { flattenCatalog } = require('../.tsbuild/publishing/domain/catalog')
const { resolveArticleSource } = require('../.tsbuild/publishing/content/source-resolver')
const { PathPolicy } = require('../.tsbuild/publishing/content/path-policy')

const articles = [
    ['minimal-string', 'string/最小表示法', 'string/minimal_rotation'],
    ['string-hash', 'string/进制hash', 'string/string_hash'],
    ['numberTheory_divisors', 'math/numberTheory/约数', 'math/numberTheory/divisors'],
    ['greedy_equal_card', 'greedy/均分纸牌', 'greedy/equalize_cards'],
    ['graph_reading_notes', 'graph/图论及其应用读书笔记', 'graph/graph_theory_notes'],
    ['knapsack_integer_partition', 'dynamic_programming/knapsack/exercises/整数划分', 'dynamic_programming/knapsack/exercises/integer_partition'],
]

describe('中文目录迁移', () => {
    it('原有文章 ID 解析到英文目录，声明的模板与复制资源仍存在', () => {
        const policy = new PathPolicy(root)
        const byId = new Map(flattenCatalog(loadCatalog(path.join(root, 'book/catalog.yaml')))
            .map(leaf => resolveArticleSource(leaf, policy.book))
            .map(article => [article.metadata.id, article]))

        for (const [id, , directory] of articles) {
            const article = byId.get(id)
            assert.ok(article, `文章 ID 丢失: ${id}`)
            const filename = id === 'knapsack_integer_partition' ? 'problem.html' : 'index.html'
            assert.equal(policy.publishHref(article.source.filePath), `/${directory}/${filename}`)
            for (const resource of [
                ...(article.metadata.code_template || []).map(template => template.code),
                ...(article.metadata.copy || []),
            ]) {
                assert.ok(fs.existsSync(path.resolve(article.source.dir, resource)), `资源丢失: ${resource}`)
            }
        }
    })

    it('文章和论文的源目录不再包含中文名称，文件名不受此约束', () => {
        function visit(directory) {
            for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
                if (!entry.isDirectory()) continue
                const target = path.join(directory, entry.name)
                assert.ok(!/\p{Script=Han}/u.test(entry.name), `中文目录: ${target}`)
                visit(target)
            }
        }
        visit(path.join(root, 'book'))
        visit(path.join(root, 'assets/papers'))
    })

    it('旧文章、模板与论文路径均有跳转，保留后续文件路径且不误匹配同名前缀', () => {
        const config = fs.readFileSync(path.join(root, 'deploy/nginx/legacy-paths.conf'), 'utf8')
        const rules = [...config.matchAll(/^rewrite (\S+) (\S+) permanent;$/gm)]
            .map(([, pattern, replacement]) => [new RegExp(pattern), replacement])
        const redirect = url => {
            const rule = rules.find(([pattern]) => pattern.test(url))
            return rule ? url.replace(...rule) : null
        }
        const pairs = articles.map(([, old, target]) => [old, target])
        for (const [, old, target] of articles.slice(0, 2)) {
            pairs.push([`code_template/${old}`, `code_template/${target}`])
        }
        pairs.push(['assets/papers/我的杂记', 'assets/papers/personal_notes'])
        pairs.push(['papers/我的杂记', 'papers/personal_notes'])

        for (const [old, target] of pairs) {
            for (const suffix of ['', '/', '/index.html', '/code/example.py', '/images/example.svg']) {
                assert.equal(redirect(`/${old}${suffix}`), `/${target}${suffix}`)
            }
            assert.equal(redirect(`/${old}_other/index.html`), null)
            assert.equal(redirect(`/${target}/index.html`), null, '新地址不应循环跳转')
        }
    })
})
