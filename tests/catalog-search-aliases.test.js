const { it, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const yaml = require('js-yaml')

const root = path.resolve(__dirname, '..')
const { loadCatalog } = require(path.join(root, '.tsbuild/publishing/content/catalog-loader.js'))
const { MenuRenderer } = require(path.join(root, '.tsbuild/publishing/domain/menu-renderer.js'))
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-aliases-'))
after(() => fs.rmSync(temp, { recursive: true, force: true }))

function load(entries) {
    const file = path.join(temp, 'catalog.yaml')
    fs.writeFileSync(file, yaml.dump(entries))
    const diagnostics = []
    return { catalog: loadCatalog(file, diagnostics), diagnostics }
}

function render(catalog) {
    return new MenuRenderer({ templateDir: path.join(root, 'src/ejs'), root: path.join(root, 'src') }).render(catalog)
}

function leafAliases(html) {
    const entities = { amp: '&', lt: '<', gt: '>', '#34': '"', '#39': "'" }
    const decode = value => value.replace(/&(amp|lt|gt|#34|#39);/g, (_, name) => entities[name])
    return [...html.matchAll(/<a\b[^>]*href="([^"]*)"([^>]*)>/g)].map(([, href, attrs]) => ({
        href,
        aliases: JSON.parse(decode(attrs.match(/data-search-aliases="([^"]*)"/)?.[1] || '[]')),
    }))
}

it('别名配置为已知字段，目录和文章均可使用，空数组有效', () => {
    const { catalog, diagnostics } = load([{ title: '线段树', path: 'sgt', search_aliases: ['sgt'], children: [{ title: '基础', path: 'base', search_aliases: [] }] }])
    assert.deepEqual(diagnostics, [])
    assert.deepEqual(catalog.entries[0].search_aliases, ['sgt'])
})

it('拒绝非数组、非字符串和空白别名，并给出所属路径', () => {
    for (const value of ['sgt', null, 42, ['sgt', 1], [''], ['  ']]) {
        const { diagnostics } = load([{ title: '线段树', path: 'sgt', search_aliases: value }])
        assert.ok(diagnostics.some(d => d.level === 'error' && /search_aliases.*path=sgt/.test(d.message)), JSON.stringify(value))
    }
})

it('祖先与本地别名合并、去重、忽略大小写；兄弟目录不会相互污染', () => {
    const { catalog } = load([
        { title: '线段树', path: 'sgt', search_aliases: [' SGT ', '线段树'], children: [
            { title: '基础', path: 'base', search_aliases: ['sgt', 'intro'] },
            { title: '扩展', path: 'extra', search_aliases: ['persistent'], children: [{ title: '版本', path: 'v' }] },
            { title: '区间', path: 'range' },
            { title: '隐藏', path: 'hidden', hidden: true, search_aliases: ['secret'] },
        ] },
        { title: '其他', path: 'other' },
    ])
    assert.deepEqual(leafAliases(render(catalog)), [
        { href: '/sgt/base/index.html', aliases: ['sgt', '线段树', 'intro'] },
        { href: '/sgt/extra/v/index.html', aliases: ['sgt', '线段树', 'persistent'] },
        { href: '/sgt/range/index.html', aliases: ['sgt', '线段树'] },
        { href: '/other/index.html', aliases: [] },
    ])
})

it('别名序列化为安全的 HTML 属性，特殊字符可原样读回', () => {
    const aliases = ['" onmouseover="alert(1)', '<img src=x>', 'a&b']
    const { catalog } = load([{ title: '测试', path: 'test', search_aliases: aliases }])
    const html = render(catalog)
    assert.ok(!html.includes('<img src=x>'))
    assert.deepEqual(leafAliases(html)[0].aliases, aliases)
})

it('真实线段树目录的每篇可见文章都继承 sgt', () => {
    const catalog = loadCatalog(path.join(root, 'book/catalog.yaml'))
    const leaves = leafAliases(render(catalog)).filter(leaf => leaf.href.startsWith('/data_structure/segment_tree/'))
    assert.ok(leaves.length > 1)
    for (const leaf of leaves) assert.ok(leaf.aliases.includes('sgt'), leaf.href)
})
