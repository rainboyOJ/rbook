const { test } = require('node:test')
const assert = require('node:assert/strict')
const model = import('../third_part/brain_net_map/model.mjs')
const nodes = [
    { id: 'a', chapter: 'one' }, { id: 'alone', chapter: 'one' },
    { id: 'b', chapter: 'two' }, { id: 'c', chapter: 'three' },
    { id: 'd', chapter: 'two' }
]
const edges = [{ from: 'c', to: 'b' }, { from: 'b', to: 'a' }, { from: 'a', to: 'd' }]
test('chapter includes direct external neighbours, leaving isolated articles in the list', async () => {
    const { chapterView } = await model
    const view = chapterView({ nodes, edges }, 'one')
    assert.deepEqual(view.nodes.map(n => n.id), ['a', 'b', 'd'])
    assert.deepEqual(view.isolated.map(n => n.id), ['alone'])
    assert.equal(view.edges.length, 2)
    assert.deepEqual(chapterView({ nodes, edges }, 'one', 'a').nodes.map(n => n.id), ['a', 'b', 'c', 'd'])
})
test('full prerequisites follow incoming links only and terminate on cycles', async () => {
    const { ancestors } = await model
    assert.deepEqual([...ancestors(edges, 'a')].sort(), ['a', 'b', 'c'])
    assert.deepEqual([...ancestors([...edges, { from: 'a', to: 'c' }], 'a')].sort(), ['a', 'b', 'c'])
})
test('layout is deterministic, non-overlapping and places prerequisites to the left', async () => {
    const { layout } = await model
    const first = layout(nodes, edges)
    assert.deepEqual(first, layout(nodes, edges))
    for (const e of edges) assert.ok(first.positions.get(e.from).x < first.positions.get(e.to).x)
    const boxes = [...first.positions.values()]
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y)
    }
    assert.equal(layout([], []).positions.size, 0)
})
test('cycles and self-links are visible diagnostics and do not prevent layout', async () => {
    const { layout } = await model
    const result = layout(nodes, [...edges, { from: 'a', to: 'c' }, { from: 'alone', to: 'alone' }])
    assert.deepEqual([...result.cyclic].sort(), ['a', 'alone', 'b', 'c'])
    assert.equal(result.positions.size, nodes.length)
})
test('published data uses valid unique nodes, edges and reading links', () => {
    const data = require('../third_part/brain_net_map/load_data.js').loadRelations()
    const ids = new Set(data.nodes.map(n => n.id))
    assert.equal(ids.size, data.nodes.length)
    for (const n of data.nodes) { assert.ok(n.id && n.title); assert.match(n.href, /^\/.*\.html$/) }
    for (const e of data.edges) { assert.ok(ids.has(e.from) && ids.has(e.to)); assert.ok(data.nodes.find(n => n.id === e.to).pre.includes(e.from)) }
})
