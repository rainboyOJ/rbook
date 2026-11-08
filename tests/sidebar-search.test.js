const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/public/js/site-shell.js'), 'utf8')
function helpers(stored = null) {
    return vm.runInNewContext(source + '\n;({ sidebarSearchTerms, filterSidebarEntries, readSidebarSearch })', {
        document: { querySelector: () => null, getElementById: () => null },
        sessionStorage: { getItem: () => stored },
    })
}
const articles = [
    { title: '对拍练习：线段覆盖', breadcrumb: '附录', href: '/stress/' },
    { title: '编译', breadcrumb: '附录 / 脚本', href: '/compile/' },
    { title: '对拍', breadcrumb: '附录 / 脚本', href: '/compare/' },
    { title: 'LCP 算法（DP）', breadcrumb: '动态规划', href: '/lcp/' },
    { title: '脚本', breadcrumb: '工具', href: '/scripts/' },
]

it('多个关键词同时匹配标题和完整目录路径，目录中的空格不影响匹配', () => {
    const { filterSidebarEntries } = helpers()
    assert.deepEqual(filterSidebarEntries(articles, ' 附录   脚本 '), [articles[1], articles[2]])
    assert.deepEqual(filterSidebarEntries(articles, '脚本 对拍'), [articles[2]])
    assert.deepEqual(filterSidebarEntries(articles, '对拍 动态规划'), [])
})

it('忽略英文大小写，重复关键词不改变匹配结果', () => {
    const { filterSidebarEntries, sidebarSearchTerms } = helpers()
    assert.deepEqual(filterSidebarEntries(articles, 'lcp dp'), [articles[3]])
    assert.deepEqual(Array.from(sidebarSearchTerms('LCP lcp\tDP')), ['lcp', 'dp'])
})

it('标题精确匹配优先，其次是前缀；同类结果保留目录顺序', () => {
    const { filterSidebarEntries } = helpers()
    assert.deepEqual(filterSidebarEntries(articles, '对拍'), [articles[2], articles[0]])
    assert.deepEqual(filterSidebarEntries(articles, '脚本'), [articles[4], articles[1], articles[2]])
})

it('清空、无结果及 HTML/正则字符都作为普通查询处理', () => {
    const { filterSidebarEntries } = helpers()
    for (const query of ['', ' \n\t ', '不存在的内容', '<img src=x>', '.*', '[']) {
        assert.deepEqual(Array.from(filterSidebarEntries(articles, query)), [], query)
    }
    assert.deepEqual(filterSidebarEntries([{ title: 'a+b', breadcrumb: 'C++', href: '/' }], 'c++'), [{ title: 'a+b', breadcrumb: 'C++', href: '/' }])
})

it('菜单显示短名时，英文 id 与正文长标题也能搜到同一篇', () => {
    const { filterSidebarEntries } = helpers()
    const lis = {
        title: 'LIS',
        breadcrumb: '动态规划',
        articleId: 'lis',
        articleTitle: '最长上长子序列',
        href: '/lis/',
    }
    const entries = [...articles, lis]
    assert.deepEqual(filterSidebarEntries(entries, 'lis'), [lis])
    assert.deepEqual(filterSidebarEntries(entries, '最长上长'), [lis])
    assert.deepEqual(filterSidebarEntries(entries, '动态规划 子序列'), [lis])
    // 没有 data-* 的旧条目照旧只按菜单名和面包屑匹配
    assert.deepEqual(filterSidebarEntries(entries, 'toposort'), [])
})

it('恢复搜索时校验关键词和结果滚动位置，不接受坏存储', () => {
    assert.equal(helpers().readSidebarSearch(), null)
    assert.equal(helpers('bad json').readSidebarSearch(), null)
    assert.equal(helpers('{"query":42}').readSidebarSearch(), null)
    const state = helpers('{"query":"对拍","top":120}').readSidebarSearch()
    assert.equal(state.query, '对拍')
    assert.equal(state.top, 120)
    assert.equal(helpers('{"query":"对拍","top":-10}').readSidebarSearch().top, 0)
})
