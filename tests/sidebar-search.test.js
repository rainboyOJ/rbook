const { it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const source = fs.readFileSync(path.join(__dirname, '../src/public/js/site-shell.js'), 'utf8')
function helpers(stored = null) {
    return vm.runInNewContext(source + '\n;({ sidebarSearchTerms, filterSidebarEntries, parseSidebarAliases, readSidebarSearch })', {
        document: { querySelector: () => null, getElementById: () => null },
        sessionStorage: { getItem: () => stored },
    })
}
const sgt = ['线段树', 'sgt', 'segtree']
const articles = [
    { title: '基础', id: 'segment_tree', searchAliases: sgt, breadcrumb: '数据结构 / 线段树' },
    { title: '区间加法', id: 'sgt-range-add', searchAliases: sgt, breadcrumb: '数据结构 / 线段树' },
    { title: '基础', id: 'bit', searchAliases: ['树状数组', 'bit', 'fenwick'] },
    { title: 'Dijkstra', id: 'dijkstra' },
    { title: 'LCP 算法（DP）', id: 'lcp', searchAliases: ['dp'] },
]

it('算法缩写、中文别名和 id 均可匹配；多个关键词可以分别命中不同字段', () => {
    const { filterSidebarEntries } = helpers()
    assert.deepEqual(filterSidebarEntries(articles, 'sgt'), articles.slice(0, 2))
    assert.deepEqual(filterSidebarEntries(articles, '线段树'), articles.slice(0, 2))
    assert.deepEqual(filterSidebarEntries(articles, 'SGT 区间'), [articles[1]])
    assert.deepEqual(filterSidebarEntries(articles, 'sgt 基础'), [articles[0]])
    assert.deepEqual(filterSidebarEntries(articles, 'sgt dijkstra'), [])
    assert.deepEqual(filterSidebarEntries(articles, 'BIT'), [articles[2]])
})

it('搜索不再读取面包屑、正文长标题或旧 articleId 字段', () => {
    const { filterSidebarEntries } = helpers()
    const lis = { title: 'LIS', id: 'lis', breadcrumb: '动态规划', articleTitle: '最长上升子序列', articleId: 'legacy' }
    assert.deepEqual(filterSidebarEntries([lis], '动态规划'), [])
    assert.deepEqual(filterSidebarEntries([lis], '最长上升子序列'), [])
    assert.deepEqual(filterSidebarEntries([lis], 'legacy'), [])
    assert.deepEqual(filterSidebarEntries([lis], 'lis'), [lis])
})

it('英文和中文均支持按顺序跳字，不允许把不同字段拼接成一个词', () => {
    const { filterSidebarEntries } = helpers()
    assert.deepEqual(filterSidebarEntries(articles, 'sgtr'), articles.slice(0, 2))
    assert.deepEqual(filterSidebarEntries(articles, '线树'), articles.slice(0, 2))
    assert.deepEqual(filterSidebarEntries([{ title: 'sg', id: 'tr' }], 'sgtr'), [])
})

it('已知别名排除仅靠跳字凑出的结果，输入拼错时仍可容错', () => {
    const { filterSidebarEntries } = helpers()
    const entries = [{ title: '树状数组', searchAliases: ['bit'] }, { title: '二叉树', id: 'binary_tree' }]
    assert.deepEqual(filterSidebarEntries(entries, 'bit'), [entries[0]])
    assert.deepEqual(filterSidebarEntries(entries, 'bti'), [entries[0]])
})

it('英文至少三个字符才容错，支持替换、插入、删除与相邻交换', () => {
    const { filterSidebarEntries } = helpers()
    for (const query of ['dijxstra', 'dijkxstra', 'dijksta', 'dijsktra', 'djxkstra']) {
        assert.deepEqual(filterSidebarEntries(articles, query), [articles[3]], query)
    }
    assert.deepEqual(filterSidebarEntries(articles, 'dxxkstrz'), [])
    assert.deepEqual(filterSidebarEntries([{ title: 'bellman-ford' }], 'bellamn-ford'), [{ title: 'bellman-ford' }])
})

it('一两个字母匹配完整词或词前缀，不做内部包含、跳字和编辑容错', () => {
    const { filterSidebarEntries } = helpers()
    const entries = [{ title: '最小生成树', id: 'mst' }, { title: '稀疏表', searchAliases: ['st'] }, { title: 'distance' }]
    assert.deepEqual(filterSidebarEntries(entries, 'st'), [entries[1]])
    assert.deepEqual(filterSidebarEntries(entries, 'dt'), [])
    assert.deepEqual(filterSidebarEntries([{ title: 'LCP 算法（DP）' }], 'dp'), [{ title: 'LCP 算法（DP）' }])
    assert.deepEqual(filterSidebarEntries(articles, 'di'), [articles[3]])
    assert.deepEqual(filterSidebarEntries(articles, '树'), [articles[2], articles[0], articles[1]])
})

it('精确、前缀、包含、跳字、容错依次排序，同级保持原顺序', () => {
    const { filterSidebarEntries } = helpers()
    const entries = ['abce', 'a-b-c-d', 'XabcdY', 'abcd序', 'abcd', '另一个abcd'].map(title => ({ title }))
    assert.deepEqual(filterSidebarEntries(entries, 'abcd'), [entries[4], entries[3], entries[2], entries[5], entries[1], entries[0]])
    const phrase = [{ title: 'a b' }, { title: 'a', id: 'b' }]
    assert.deepEqual(filterSidebarEntries(phrase, 'a b'), phrase)
})

it('多个关键词按最弱匹配等级排序，不能用一个精确词掩盖另一个容错词', () => {
    const { filterSidebarEntries } = helpers()
    const entries = [{ title: 'abc', id: 'wxyq' }, { title: 'abc基础', id: 'wxyz基础' }]
    assert.deepEqual(filterSidebarEntries(entries, 'abc wxyz'), [entries[1], entries[0]])
})

it('忽略大小写与重复关键词；空输入、无结果、HTML/正则符号按字面处理', () => {
    const { filterSidebarEntries, sidebarSearchTerms } = helpers()
    assert.deepEqual(Array.from(sidebarSearchTerms('SGT sgt\t区间')), ['sgt', '区间'])
    for (const query of ['', ' \n\t ', '不存在的内容', '<img src=x>', '.*', '[']) {
        assert.deepEqual(Array.from(filterSidebarEntries(articles, query)), [], query)
    }
    assert.deepEqual(filterSidebarEntries([{ title: 'C++ 的 a+b' }], 'c++ a+b'), [{ title: 'C++ 的 a+b' }])
})

it('别名 JSON 只读取字符串数组，坏数据安全回退', () => {
    const { parseSidebarAliases } = helpers()
    assert.deepEqual(Array.from(parseSidebarAliases('["sgt","线段树"]')), ['sgt', '线段树'])
    for (const value of [undefined, 'bad json', '{}', 'null']) assert.deepEqual(Array.from(parseSidebarAliases(value)), [])
    assert.deepEqual(Array.from(parseSidebarAliases('[null,42,"", "sgt"]')), ['sgt'])
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
