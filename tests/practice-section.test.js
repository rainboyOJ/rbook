const { describe, it, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const load = rel => require(path.join(PROJECT_ROOT, '.tsbuild', 'publishing', rel))

const { Pcs2PracticeProvider, loadPcs2PracticeProvider } = load('integrations/pcs2-practice-provider.js')
const {
    buildPracticeSection,
    appendPracticeSection,
    PRACTICE_SECTION_HEADING,
    PRACTICE_EMPTY_TEXT,
} = load('pipeline/practice-section.js')
const { PathPolicy } = load('content/path-policy.js')
const { PageTemplateRenderer } = load('templates/page-template-renderer.js')
const { renderArticle } = load('pipeline/render-article.js')

const tmpRoots = []

function makeTmpDir(prefix = 'rbook-practice-') {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
    tmpRoots.push(dir)
    return dir
}

function writeProblem(root, oj, id, frontMatter) {
    const dir = path.join(root, 'problems', oj, id)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.md'), `---\n${frontMatter}\n---\n\n正文\n`)
}

after(() => {
    for (const dir of tmpRoots) fs.rmSync(dir, { recursive: true, force: true })
})

describe('pcs2 相关题解：数据源', () => {
    function createRepo() {
        const root = makeTmpDir()
        writeProblem(root, 'luogu', 'P1', [
            'oj: "luogu"',
            'problem_id: "P1"',
            'title: "甲"',
            'difficulty: "提高"',
            'showAtRbook: ["rbook1:alpha", "rbook1:beta"]',
        ].join('\n'))
        writeProblem(root, 'roj', '3000', [
            'oj: "roj"',
            'problem_id: "3000"',
            'title: "乙"',
            'difficulty: "入门"',
            'showAtRbook: ["rbook1:alpha", "rbook2:other"]',
        ].join('\n'))
        // 只有 rbook2 引用的题目不属于本书
        writeProblem(root, 'atcoder', 'x', [
            'oj: "atcoder"',
            'problem_id: "x"',
            'title: "丙"',
            'difficulty: "入门"',
            'showAtRbook: ["rbook2:alpha"]',
        ].join('\n'))
        // 块状数组 + 表里没有的难度
        writeProblem(root, 'luogu', 'P3', [
            'oj: "luogu"',
            'problem_id: "P3"',
            'title: "丁"',
            'difficulty: "远古难度"',
            'showAtRbook:',
            '  - "rbook1:alpha"',
        ].join('\n'))
        fs.mkdirSync(path.join(root, 'lib'), { recursive: true })
        fs.writeFileSync(path.join(root, 'lib', 'difficulty.json'), JSON.stringify({
            values: [
                { value: '入门', ranked: true },
                { value: '提高', ranked: true },
                { value: '未知', ranked: false },
            ],
        }))
        return root
    }

    it('只收 rbook1: 引用，按难度升序（未知排最后）', () => {
        const root = createRepo()
        const provider = new Pcs2PracticeProvider({
            problemsDir: path.join(root, 'problems'),
            publicBaseUrl: 'https://pcs2.test',
        })

        const alpha = provider.getProblemsForArticle('alpha')
        assert.deepEqual(
            alpha.map(p => `${p.oj}/${p.problemId}`),
            ['roj/3000', 'luogu/P1', 'luogu/P3'],
        )
        assert.equal(alpha[0].url, 'https://pcs2.test/problems/roj/3000')
        assert.deepEqual(provider.getProblemsForArticle('beta').map(p => p.problemId), ['P1'])
        // rbook2 引用与本书无关
        assert.deepEqual(provider.getProblemsForArticle('other'), [])
        // 未关联的文章返回空数组而不是 undefined
        assert.deepEqual(provider.getProblemsForArticle('nope'), [])
    })

    it('题目目录不存在时返回 null provider 与原因，不抛错', () => {
        const missing = path.join(makeTmpDir(), 'does-not-exist')
        const result = loadPcs2PracticeProvider({ projectRoot: PROJECT_ROOT, problemsDir: missing })
        assert.equal(result.provider, null)
        assert.match(result.reason, /PCS2_PROBLEMS_DIR/)
        assert.ok(result.reason.includes(missing))
    })
})

describe('pcs2 相关题解：小节渲染', () => {
    it('没有题解时保留标题并显示「暂无相关题解」', () => {
        const md = buildPracticeSection([])
        assert.ok(md.startsWith(PRACTICE_SECTION_HEADING))
        assert.ok(md.includes(PRACTICE_EMPTY_TEXT))
        assert.ok(!md.includes('| 题目 |'))
    })

    it('生成三列表格，并转义会破坏表格/链接的字符', () => {
        const md = buildPracticeSection([
            {
                oj: 'luogu',
                problemId: 'P1',
                title: '[USACO08DEC] a|b <c>',
                difficulty: '普及-',
                url: 'https://pcs2.test/problems/luogu/P1',
            },
        ])
        assert.ok(md.includes('| 题目 | OJ | 难度 |'))
        assert.ok(md.includes(
            '<a href="https://pcs2.test/problems/luogu/P1" target="_blank" rel="noopener noreferrer">'
            + '[USACO08DEC] a\\|b &lt;c&gt;</a>',
        ))
        assert.ok(md.includes('| luogu | 普及- |'))
    })

    it('拼接时去掉正文尾部空白，并保证中间有空行', () => {
        const out = appendPracticeSection('# 标题\n\n正文\n\n\n', '## 相关题解\n\n暂无相关题解')
        assert.equal(out, '# 标题\n\n正文\n\n## 相关题解\n\n暂无相关题解\n')
    })
})

describe('pcs2 相关题解：文章注入', () => {
    const policy = new PathPolicy(PROJECT_ROOT)
    const templateRenderer = new PageTemplateRenderer({
        templateDir: path.join(PROJECT_ROOT, 'src', 'ejs'),
        root: PROJECT_ROOT,
    })
    const index = { byId: new Map(), bySourcePath: new Map(), byPublishHref: new Map(), all: [] }

    const practiceProvider = {
        getProblemsForArticle: () => [{
            oj: 'luogu',
            problemId: 'P1',
            title: '甲',
            difficulty: '入门',
            url: 'https://pcs2.test/problems/luogu/P1',
        }],
    }

    function renderWithArticle(frontMatter) {
        const dir = makeTmpDir('rbook-practice-article-')
        fs.writeFileSync(path.join(dir, 'index.md'), `---\n${frontMatter}---\n\n# 测试文章\n\n正文。\n`)
        return renderArticle({
            entryPath: dir,
            policy,
            index,
            templateRenderer,
            practiceProvider,
            diagnostics: [],
        })
    }

    it('正式文章末尾自动出现「相关题解」表格', () => {
        const result = renderWithArticle('title: 开\nrbook:\n  id: practice-on\n')
        assert.ok(result.html.includes('相关题解'))
        assert.ok(result.html.includes('<table>'))
        // 题目链接必须是新标签页打开，且 href 原样保留
        assert.ok(result.html.includes(
            '<a href="https://pcs2.test/problems/luogu/P1" target="_blank" rel="noopener noreferrer">',
        ))
    })

    it('practice: false 时不注入', () => {
        const result = renderWithArticle('title: 关\nrbook:\n  id: practice-off\n  practice: false\n')
        assert.ok(!result.html.includes('相关题解'))
    })
})
