/**
 * 标题解析的唯一规则：config.title → md frontmatter title → catalog 导航标题 → 未知。
 *
 * 页面与 dist/catalog.json 必须共用它，否则同一篇文章在两处显示不同名字：
 * 以前页面落到「未知」，清单落到 catalog 标题。
 */
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const { resolveArticleTitle, titleNeedsAuthoring } = require(
    path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/article-title.js'),
)

describe('文章标题解析', () => {
    it('config.title 优先于 frontmatter title 与导航标题', () => {
        assert.equal(
            resolveArticleTitle({ metadataTitle: '线性筛', headerTitle: '# 筛法', catalogTitle: '数论' }),
            '线性筛',
        )
    })

    it('没有 config.title 时退到 md frontmatter 的 title', () => {
        assert.equal(
            resolveArticleTitle({ metadataTitle: '', headerTitle: '图的定义', catalogTitle: '图' }),
            '图的定义',
        )
    })

    it('两者都没有时退到 catalog 导航标题，而不是「未知」', () => {
        assert.equal(resolveArticleTitle({ metadataTitle: '', headerTitle: '', catalogTitle: '题目' }), '题目')
    })

    it('只有完全没有 catalog 上下文时才落到「未知」', () => {
        assert.equal(resolveArticleTitle({}), '未知')
    })

    it('空白字符串不算标题', () => {
        assert.equal(resolveArticleTitle({ metadataTitle: '   ', catalogTitle: '题目' }), '题目')
    })

    it('titleNeedsAuthoring 指出标题是靠导航名冒充的', () => {
        assert.equal(titleNeedsAuthoring({ metadataTitle: '', headerTitle: '', catalogTitle: '题目' }), true)
        assert.equal(titleNeedsAuthoring({ metadataTitle: 'A', catalogTitle: '题目' }), false)
        assert.equal(titleNeedsAuthoring({ headerTitle: 'A', catalogTitle: '题目' }), false)
    })
})

describe('frontmatter title 解析', () => {
    const { frontMatterTitle } = require(path.join(PROJECT_ROOT, '.tsbuild/publishing/domain/article-title.js'))

    it('紧贴第一行的 frontmatter 才会被识别', () => {
        assert.equal(frontMatterTitle('---\ntitle: 二分查找\n---\n\n正文'), '二分查找')
        assert.equal(frontMatterTitle('\n---\ntitle: 不会识别\n---\n'), '')
        assert.equal(frontMatterTitle('# 只有 H1\n'), '')
    })

    it('去引号、忽略大小写键名、只取第一个 title', () => {
        assert.equal(frontMatterTitle('---\nTitle: "离散化"\n---\n'), '离散化')
        assert.equal(frontMatterTitle("---\ntitle: '图论'\ntitle: 第二个\n---\n"), '图论')
    })

    it('frontmatter 没闭合时当作没有标题', () => {
        assert.equal(frontMatterTitle('---\ntitle: 孤零零\n正文'), '')
    })
})
