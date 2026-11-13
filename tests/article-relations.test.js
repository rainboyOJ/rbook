const { test } = require('node:test')
const assert = require('node:assert/strict')
const model = import('../third_part/brain_net_map/model.mjs')
const nodes = [
    { id: 'a', chapter: 'one', directory: 'one-sub' }, { id: 'alone', chapter: 'one', directory: 'one' },
    { id: 'b', chapter: 'two', directory: 'two' }, { id: 'c', chapter: 'three', directory: 'three' },
    { id: 'd', chapter: 'two', directory: 'two' },
]
const edges = [{ from: 'c', to: 'b' }, { from: 'b', to: 'a' }, { from: 'a', to: 'd' }]
const directories = [
    { id: '@book', parent: null }, { id: 'one', parent: '@book' }, { id: 'one-sub', parent: 'one' },
    { id: 'two', parent: '@book' }, { id: 'three', parent: '@book' },
]
const data = { nodes, edges, directories }
test('chapter keeps isolated articles and only direct external neighbours', async () => {
    const { chapterView } = await model
    const view = chapterView(data, 'one')
    assert.deepEqual(view.nodes.map(n => n.id), ['a', 'alone', 'b', 'd'])
    assert.equal(view.edges.length, 2)
    assert.deepEqual(chapterView(data).nodes, nodes)
    assert.deepEqual(chapterView(data).edges, edges)
    assert.deepEqual(chapterView(data, 'missing'), { nodes: [], edges: [] })
})
test('radial centre preserves selection or chooses highest degree, including empty and isolated graphs', async () => {
    const { centreNode } = await model
    assert.equal(centreNode(nodes, edges, 'd'), 'd')
    assert.equal(centreNode(nodes, edges), 'a')
    assert.equal(centreNode([], []), null)
    assert.equal(centreNode([nodes[1]], []), 'alone')
})
test('directory view preserves catalog parents and does not turn prerequisites into tree edges', async () => {
    const { directoryView, chapterView } = await model
    const view = directoryView(data, chapterView(data, 'one').nodes)
    assert.ok(!view.nodes.some(n => n.id === 'three' || n.id === 'c'))
    assert.ok(view.edges.some(e => e.from === 'one-sub' && e.to === 'a'))
    assert.ok(!view.edges.some(e => e.from === 'b' && e.to === 'a'))
    assert.equal(view.edges.length, view.nodes.length - 1)
    for (const n of view.nodes) {
        if (n.id !== '@book') assert.equal(view.edges.filter(e => e.to === n.id).length, 1)
    }
})
test('folding hides descendants without losing articles; searching reveals the full catalog path', async () => {
    const { directoryView, revealDirectory } = await model
    const collapsed = new Set(['one', 'one-sub', 'two'])
    const folded = directoryView(data, nodes, collapsed)
    assert.ok(folded.nodes.some(n => n.id === 'one' && n.collapsed && n.childCount === 2))
    assert.ok(!folded.nodes.some(n => n.id === 'a' || n.id === 'alone'))
    revealDirectory(data, 'a', collapsed)
    assert.deepEqual([...collapsed], ['two'])
    assert.ok(directoryView(data, nodes, collapsed).nodes.some(n => n.id === 'a'))
    assert.ok(!directoryView(data, nodes, collapsed).nodes.some(n => n.id === 'b'))
    assert.equal(directoryView(data, nodes).nodes.filter(n => n.kind === 'article').length, nodes.length)
})
test('published data has unique nodes, complete directory paths and valid prerequisite edges', () => {
    const published = require('../third_part/brain_net_map/load_data.js').loadRelations()
    const ids = new Set(published.nodes.map(n => n.id)), dirs = new Map(published.directories.map(d => [d.id, d]))
    assert.equal(ids.size, published.nodes.length)
    assert.equal(dirs.size, published.directories.length)
    for (const n of published.nodes) {
        assert.ok(n.id && n.title); assert.match(n.href, /^\/.*\.html$/)
        const seen = new Set(); let id = n.directory
        while (id) { assert.ok(dirs.has(id)); assert.ok(!seen.has(id)); seen.add(id); id = dirs.get(id).parent }
        assert.ok(seen.has('@book'))
    }
    assert.ok(ids.has('dp_intro'))
    for (const e of published.edges) { assert.ok(ids.has(e.from) && ids.has(e.to)); assert.ok(published.nodes.find(n => n.id === e.to).pre.includes(e.from)) }
})
test('Dagre component packing preserves edge geometry, avoids component overlap and retains isolates', async () => {
    const { packComponents } = await model
    const positions = { a: [400, 200], b: [200, 100], c: [0, 100], d: [600, 400], alone: [0, 10000] }
    const packed = packComponents(nodes, edges, positions)
    assert.equal(Object.keys(packed).length, nodes.length)
    for (const e of edges) {
        assert.deepEqual([packed[e.to][0] - packed[e.from][0], packed[e.to][1] - packed[e.from][1]],
            [positions[e.to][0] - positions[e.from][0], positions[e.to][1] - positions[e.from][1]])
    }
    const linked = ['a', 'b', 'c', 'd'].map(id => packed[id])
    const [x, y] = packed.alone
    assert.ok(x + 200 <= Math.min(...linked.map(p => p[0])) || x - 200 >= Math.max(...linked.map(p => p[0])) ||
        y + 76 <= Math.min(...linked.map(p => p[1])) || y - 76 >= Math.max(...linked.map(p => p[1])))
    assert.ok(y < 2000)
    assert.deepEqual(packComponents([], [], {}), {})
})
