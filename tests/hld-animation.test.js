const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { parseTree, decompose, PRESETS } = require('../book/tree/hld/hld-model.ts')
const { tidyLayout } = require('../book/tree/hld/tidy-tree.ts')

function descendants(tree, u) {
    return [u, ...tree.children[u].flatMap(v => descendants(tree, v))]
}

// Seeded trees exercise roots other than 1, asymmetric contours and long chains.
function fixtures() {
    let seed = 16807
    const random = n => {
        seed = (seed * 48271) % 2147483647
        return seed % n
    }
    const trees = PRESETS.map(preset => parseTree(preset.input))
    for (let n = 2; n <= 80; n++) {
        trees.push({ n, root: random(n) + 1, edges: Array.from({ length: n - 1 }, (_, i) => [i + 2, random(i + 1) + 1]) })
    }
    trees.push({ n: 80, root: 80, edges: Array.from({ length: 79 }, (_, i) => [i + 1, i + 2]) })
    trees.push({ n: 80, root: 1, edges: Array.from({ length: 79 }, (_, i) => [1, i + 2]) })
    return trees
}

describe('HLD 结果观察器', () => {
    it('文章示例的所有数组与图示一致', () => {
        const tree = decompose(parseTree(PRESETS[0].input))
        assert.deepEqual(tree.size.slice(1), [5, 1, 3, 1, 1])
        assert.deepEqual(tree.heavy.slice(1), [3, 0, 4, 0, 0])
        assert.deepEqual(tree.top.slice(1), [1, 2, 1, 1, 5])
        assert.deepEqual(tree.dfn.slice(1), [1, 5, 2, 3, 4])
        assert.deepEqual(tree.rev.slice(1), [1, 3, 4, 5, 2])
        assert.deepEqual(tree.chains, [[1, 3, 4], [5], [2]])
    })

    it('校验格式、边数、范围、自环、重复边、环及非连通图', () => {
        for (const source of [
            '', '1', '2 1\n1', '2 1\n1 2 3', '1.5 1', '1e1 1', 'NaN 1',
            '0 1', '81 1', '2 0\n1 2', '2 3\n1 2', '3 1\n1 2',
            '2 1\n1 3', '2 1\n1 1', '3 1\n1 2\n2 1',
            '4 1\n1 2\n2 3\n3 1', '9007199254740992 1',
        ]) assert.throws(() => parseTree(source), Error, source)
        assert.deepEqual(parseTree('\n  2  2\r\n\n 1 2 \n'), { n: 2, root: 2, edges: [[1, 2]] })
        assert.deepEqual(parseTree('1 1'), { n: 1, root: 1, edges: [] })
    })

    it('重儿子并列时遵循输入顺序，轻儿子逆序入 DFS 序', () => {
        const tree = decompose(parseTree('5 1\n1 4\n1 2\n1 5\n1 3'))
        assert.equal(tree.heavy[1], 4)
        assert.deepEqual(tree.rev.slice(1), [1, 4, 3, 5, 2])
    })

    it('对多种树逐点验证子树区间、最大儿子、链头及连续编号', () => {
        for (const input of fixtures()) {
            const tree = decompose(input)
            assert.equal(tree.dfn[input.root], 1)
            assert.equal(new Set(tree.dfn.slice(1)).size, input.n)
            assert.equal(tree.chains.flat().length, input.n)
            for (let u = 1; u <= input.n; u++) {
                const nodes = descendants(tree, u)
                assert.equal(tree.size[u], nodes.length)
                assert.deepEqual(nodes.map(v => tree.dfn[v]).sort((a, b) => a - b),
                    Array.from({ length: nodes.length }, (_, i) => tree.dfn[u] + i))
                assert.equal(tree.rev[tree.dfn[u]], u)
                if (tree.heavy[u]) {
                    assert.equal(tree.size[tree.heavy[u]], Math.max(...tree.children[u].map(v => descendants(tree, v).length)))
                    assert.equal(tree.top[tree.heavy[u]], tree.top[u])
                    assert.equal(tree.dfn[tree.heavy[u]], tree.dfn[u] + 1)
                }
                for (const v of tree.children[u]) {
                    if (v !== tree.heavy[u]) assert.equal(tree.top[v], v)
                }
            }
        }
    })

    it('tidy 布局同层不重叠、父节点居中且同层高度一致', () => {
        for (const input of fixtures()) {
            const tree = decompose(input)
            const points = tidyLayout(tree.children, input.root)
            const levels = new Map()
            for (let u = 1; u <= input.n; u++) {
                const { x, y } = points[u]
                assert.ok(Number.isFinite(x) && Number.isFinite(y))
                assert.equal(y, tree.depth[u])
                if (!levels.has(y)) levels.set(y, [])
                levels.get(y).push(x)
                const children = tree.children[u]
                if (children.length) {
                    const center = (points[children[0]].x + points[children.at(-1)].x) / 2
                    assert.ok(Math.abs(center - x) < 1e-8)
                    for (let i = 1; i < children.length; i++) assert.ok(points[children[i]].x > points[children[i - 1]].x)
                }
            }
            for (const xs of levels.values()) {
                xs.sort((a, b) => a - b)
                for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 1 - 1e-8)
            }
        }
    })

    it('反转所有孩子顺序，得到原布局的镜像', () => {
        for (const input of fixtures()) {
            const tree = decompose(input)
            const points = tidyLayout(tree.children, input.root)
            const reflected = tidyLayout(tree.children.map(list => [...list].reverse()), input.root)
            for (let u = 1; u <= input.n; u++) {
                assert.ok(Math.abs(points[u].x + reflected[u].x) < 1e-8, `n=${input.n}, u=${u}`)
                assert.equal(points[u].y, reflected[u].y)
            }
        }
    })
})
