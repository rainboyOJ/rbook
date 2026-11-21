const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const dir = path.resolve(__dirname, '../book/graph/mst')
const compiled = ts.transpileModule(fs.readFileSync(path.join(dir, 'edge-game-model.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const { GAME_EDGES, VERTEX_COUNT, toggleGameEdge, selectionStats } = new Function('exports', `${compiled}\nreturn exports`)({})

// 独立用邻接矩阵传递闭包判断连通性，避免重复模型中的寻路与并查集实现。
function oracle(selected) {
    const reach = Array.from({ length: VERTEX_COUNT + 1 }, (_, u) => Array.from({ length: VERTEX_COUNT + 1 }, (_, v) => u === v))
    let weight = 0
    for (const e of GAME_EDGES) if (selected.has(e.id)) {
        reach[e.u][e.v] = reach[e.v][e.u] = true
        weight += e.weight
    }
    for (let k = 1; k <= VERTEX_COUNT; k++) for (let u = 1; u <= VERTEX_COUNT; u++) for (let v = 1; v <= VERTEX_COUNT; v++) {
        reach[u][v] ||= reach[u][k] && reach[k][v]
    }
    let components = 0
    for (let u = 1; u <= VERTEX_COUNT; u++) if (!reach[u].slice(1, u).some(Boolean)) components++
    return { reach, components, weight, forest: selected.size === VERTEX_COUNT - components }
}

test('the game uses exactly the graph given in the article', () => {
    const text = fs.readFileSync(path.join(dir, 'index.md'), 'utf8')
    const lines = text.match(/~~~text\n5 8\n([\s\S]*?)\n~~~/)[1].split('\n').map(s => s.split(' ').map(Number))
    assert.deepEqual(GAME_EDGES.map(e => [e.u, e.v, e.weight]), lines)
    assert.equal(VERTEX_COUNT, 5)
})

test('every legal forest and every possible next click agrees with connectivity', () => {
    let forests = 0
    for (let mask = 0; mask < 1 << GAME_EDGES.length; mask++) {
        const selected = new Set(GAME_EDGES.filter((_, i) => mask & 1 << i).map(e => e.id))
        const expected = oracle(selected)
        if (!expected.forest) continue
        forests++
        assert.deepEqual(selectionStats(selected), {
            edgeCount: selected.size, components: expected.components, weight: expected.weight,
            complete: expected.components === 1,
        })
        for (const e of GAME_EDGES) {
            const before = [...selected]
            const move = toggleGameEdge(selected, e.id)
            assert.deepEqual([...selected], before, 'a click must not mutate its input state')
            const kind = selected.has(e.id) ? 'removed' : expected.reach[e.u][e.v] ? 'cycle' : 'added'
            assert.equal(move.kind, kind)
            const next = new Set(selected)
            if (kind === 'removed') next.delete(e.id)
            if (kind === 'added') next.add(e.id)
            assert.deepEqual(move.selected, next)
            assert.ok(oracle(move.selected).forest)
            if (kind !== 'cycle') continue
            assert.equal(move.path.nodes[0], e.u)
            assert.equal(move.path.nodes.at(-1), e.v)
            assert.equal(move.path.nodes.length, move.path.edges.length + 1)
            assert.equal(new Set(move.path.nodes).size, move.path.nodes.length)
            move.path.edges.forEach((id, i) => {
                assert.ok(selected.has(id))
                const edge = GAME_EDGES.find(e => e.id === id)
                assert.deepEqual(new Set([edge.u, edge.v]), new Set(move.path.nodes.slice(i, i + 2)))
            })
        }
    }
    assert.ok(forests > 50)
})

test('removing an interior edge changes later cycle decisions', () => {
    let selected = new Set([1, 2])
    assert.equal(toggleGameEdge(selected, 3).kind, 'cycle')
    selected = toggleGameEdge(selected, 2).selected
    assert.equal(selectionStats(selected).components, 4)
    const added = toggleGameEdge(selected, 3)
    assert.equal(added.kind, 'added')
    assert.equal(selectionStats(added.selected).components, 3)
})

test('a nonminimum spanning tree completes the exercise', () => {
    let selected = new Set()
    for (const id of [8, 6, 5, 2]) {
        const move = toggleGameEdge(selected, id)
        assert.equal(move.kind, 'added')
        selected = move.selected
    }
    assert.deepEqual(selectionStats(selected), { edgeCount: 4, components: 1, weight: 18, complete: true })
})
