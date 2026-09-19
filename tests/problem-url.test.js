const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { ProblemUrlResolver, normalizeLuogu, frontmatter } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/integrations/problem-url.js'),
)
const { parseProblemRef } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/markdown/plugins/rbook-link.js'),
)

/**
 * 题目链接统一路由：oj-pid -> URL + 标题
 * 路由规则：roj -> roj.ac.cn/problem/{id}；其余 -> pcs2；缺失 -> 官方站回退
 */
describe('题目链接路由 (problem-url)', () => {
    function makeResolver() {
        const diag = []
        const r = new ProblemUrlResolver({ projectRoot: PROJECT_ROOT, diagnostics: diag })
        return { r, diag }
    }

    it('roj 走 roj.ac.cn/problem/{id}（老题只有该站有）', () => {
        const { r } = makeResolver()
        const x = r.resolve('roj', '1262')
        assert.equal(x.url, 'https://roj.ac.cn/problem/1262')
        assert.equal(x.normalizedOj, 'roj')
        assert.equal(x.normalizedPid, '1262')
    })

    it('题库仓库收录的 luogu 题走 pcs2，且补 P 前缀', () => {
        const { r } = makeResolver()
        const x = r.resolve('luogu', '1048')
        assert.equal(x.normalizedPid, 'P1048')
        assert.equal(x.url, 'https://pcs2.roj.ac.cn/problems/luogu/P1048/')
        assert.ok(x.known, '应在题库仓库里找到')
        assert.ok(x.title.length > 0, '应有标题')
    })

    it('luogu 题号规范化：1048 / p1048 / P1048 等价', () => {
        assert.equal(normalizeLuogu('1048'), 'P1048')
        assert.equal(normalizeLuogu('p1048'), 'P1048')
        assert.equal(normalizeLuogu('P1048'), 'P1048')
        assert.equal(normalizeLuogu('B3637'), 'B3637')
        assert.equal(normalizeLuogu('U197280'), 'U197280')
    })

    it('noiopenjudge 别名映射为 noi_openjudge，斜杠转短横', () => {
        const { r, diag } = makeResolver()
        const x = r.resolve('noiopenjudge', 'ch0304/2406')
        assert.equal(x.normalizedOj, 'noi_openjudge')
        assert.equal(x.normalizedPid, 'ch0304-2406')
        assert.equal(x.url, 'https://pcs2.roj.ac.cn/problems/noi_openjudge/ch0304-2406/')
        assert.ok(x.known, '应在题库仓库里找到')
        // noiopenjudge 是历史合法写法，不应报拼写错误
        assert.ok(!diag.some(d => d.message.includes('拼写')), 'noiopenjudge 不应报拼写错误')
    })

    it('awcing 拼写错误被纠正并发出 warning', () => {
        const { r, diag } = makeResolver()
        const x = r.resolve('awcing', '237')
        assert.equal(x.normalizedOj, 'acwing')
        assert.ok(
            diag.some(d => d.level === 'warning' && d.message.includes('拼写')),
            `应报拼写 warning，实际: ${JSON.stringify(diag)}`,
        )
    })

    it('leetcodecn 数字题号翻译为 slug（否则 leetcode.cn 404）', () => {
        const { r } = makeResolver()
        const x = r.resolve('leetcodecn', '724')
        assert.equal(x.normalizedPid, 'find-pivot-index')
        assert.equal(x.url, 'https://leetcode.cn/problems/find-pivot-index/')
    })

    it('题库仓库缺失时回退到各 OJ 官方站', () => {
        const { r } = makeResolver()
        // acwing 在题库仓库里只有 2 题，41 不在其中 -> 回退官方站
        const x = r.resolve('acwing', '41')
        assert.equal(x.url, 'https://www.acwing.com/problem/content/41/')
        assert.equal(x.source, 'fallback')

        // luogu 不在仓库里的题 -> 回退 luogu 官方站
        const y = r.resolve('luogu', 'B3637')
        assert.equal(y.url, 'https://www.luogu.com.cn/problem/B3637')
    })

    it('vjudge 回退到 vjudge.net', () => {
        const { r } = makeResolver()
        const x = r.resolve('vjudge', 'HDU-1556')
        assert.equal(x.url, 'https://vjudge.net/problem/HDU-1556')
    })

    it('标题优先级：题库 > 内联 > 空', () => {
        const { r } = makeResolver()
        // 题库里有 -> 用题库标题
        const a = r.resolve('luogu', '1048', '手写标题')
        assert.ok(a.title.includes('采药'), `题库标题应优先，实际: ${a.title}`)

        // 题库里没有 -> 用内联标题
        const b = r.resolve('acwing', '41', '手写标题')
        assert.equal(b.title, '手写标题')

        // 都没有 -> 空（渲染为裸 id）
        const c = r.resolve('acwing', '41')
        assert.equal(c.title, '')
    })

    it('base 可用环境变量覆盖', () => {
        const diag = []
        const r = new ProblemUrlResolver({
            projectRoot: PROJECT_ROOT,
            diagnostics: diag,
            pcs2Base: 'https://staging.example.com/',
            rojBase: 'https://roj-staging.example.com/',
        })
        assert.equal(r.resolve('roj', '1262').url, 'https://roj-staging.example.com/problem/1262')
        assert.equal(r.resolve('luogu', '1048').url, 'https://staging.example.com/problems/luogu/P1048/')
    })

    it('题库仓库不存在时降级但不崩溃', () => {
        const diag = []
        const r = new ProblemUrlResolver({
            projectRoot: PROJECT_ROOT,
            diagnostics: diag,
            problemRepoDir: '/definitely/not/a/real/repo',
        })
        assert.equal(r.isRepoAvailable, false)
        assert.ok(diag.some(d => d.message.includes('题库仓库不存在')))
        // 仍能生成链接（走官方站回退）
        assert.equal(r.resolve('luogu', '1048').url, 'https://www.luogu.com.cn/problem/P1048')
    })

    it('parseProblemRef 解析 oj-pid 与可选标题', () => {
        assert.deepEqual(parseProblemRef('luogu-P1048'), { oj: 'luogu', pid: 'P1048', inlineTitle: undefined })
        assert.deepEqual(parseProblemRef('luogu-1048 | 采药'), { oj: 'luogu', pid: '1048', inlineTitle: '采药' })
        // pid 本身含短横：只按第一个短横切分
        assert.deepEqual(parseProblemRef('vjudge-HDU-1556'), { oj: 'vjudge', pid: 'HDU-1556', inlineTitle: undefined })
        assert.deepEqual(parseProblemRef('noi_openjudge-ch0304-2406'), {
            oj: 'noi_openjudge', pid: 'ch0304-2406', inlineTitle: undefined,
        })
        // 非法输入
        assert.equal(parseProblemRef('luogu'), null)
        assert.equal(parseProblemRef('-1048'), null)
    })

    it('frontmatter 取值容错', () => {
        assert.equal(frontmatter('title: "采药"\n', 'title'), '采药')
        assert.equal(frontmatter("problem_id: 'P1048'\n", 'problem_id'), 'P1048')
        assert.equal(frontmatter('oj: luogu\n', 'title'), null)
    })
})
