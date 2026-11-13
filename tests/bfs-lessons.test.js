const { test } = require('node:test')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { GRID, bfsFrames } = require('../book/search/bfs/bfs-model.ts')
const { EDGES, zeroOneFrames } = require('../book/search/zero_one_bfs/zero-one-model.ts')

// Independent all-pairs oracle: no queue, deque or greedy extraction.
function floyd(n, edges, source) {
    const d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity))
    for (const e of edges) d[e.from - 1][e.to - 1] = Math.min(d[e.from - 1][e.to - 1], e.weight)
    for (let k = 0; k < n; k++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j])
    return d[source - 1]
}
function gridOracle(grid, source) {
    const rows = grid.length, cols = grid[0].length, edges = []
    for (let x = 0; x < rows; x++) for (let y = 0; y < cols; y++) {
        if (grid[x][y] === '1') continue
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] === '0') edges.push({ from: x * cols + y + 1, to: nx * cols + ny + 1, weight: 1 })
        }
    }
    return floyd(rows * cols, edges, source + 1).map((d, i) => grid[Math.floor(i / cols)][i % cols] === '1' || !Number.isFinite(d) ? -1 : d)
}
let seed = 20261113
function rand(n) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n }

test('maze animation matches shortest distances and reconstructs an adjacent shortest route', () => {
    const frames = bfsFrames(), done = frames.at(-1), cols = GRID[0].length
    assert.deepEqual(done.distances, gridOracle(GRID, 0))
    assert.equal(done.distances.at(-1), 8)
    assert.equal(done.path.length, 9)
    assert.equal(done.path[0], 0); assert.equal(done.path.at(-1), 24)
    for (let i = 1; i < done.path.length; i++) {
        const a = done.path[i - 1], b = done.path[i]
        assert.equal(Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) + Math.abs(a % cols - b % cols), 1)
        assert.equal(GRID[Math.floor(b / cols)][b % cols], '0')
    }
    for (let k = 0; k < frames.length; k++) {
        const f = frames[k], keys = f.queue.map(v => f.distances[v])
        assert.deepEqual(keys, [...keys].sort((a, b) => a - b))
        assert.equal(new Set(f.queue).size, f.queue.length)
        for (let v = 0; v < done.distances.length; v++) if (f.distances[v] >= 0) assert.equal(f.distances[v], done.distances[v])
    }
    assert.deepEqual(frames[0].queue, [0])
    assert.equal(frames[0].distances[1], -1)
    assert.equal(bfsFrames(['0'], 0, 0).at(-1).distances[0], 0)
    assert.equal(bfsFrames(['010', '111', '010']).at(-1).path.length, 0)
})
test('0-1 animation really improves discovered points and skips both obsolete entries', () => {
    const frames = zeroOneFrames()
    assert.deepEqual(frames.at(-1).distances.slice(1), [0, 0, 0, 0])
    assert.deepEqual(frames.filter(f => f.kind === 'skip').map(f => f.current), [3, 4])
    const first3 = frames.find(f => Number.isFinite(f.distances[3]))
    assert.equal(first3.distances[3], 1)
    const improved = frames.find(f => f.edge === 3)
    assert.equal(improved.distances[3], 0)
    assert.deepEqual(improved.queue, [{ vertex: 3, distance: 0 }, { vertex: 3, distance: 1 }, { vertex: 4, distance: 1 }])
    assert.deepEqual(frames.at(-1).settled, [1, 2, 3, 4])
    for (const f of frames) {
        const keys = f.queue.map(e => e.distance)
        assert.deepEqual(keys, [...keys].sort((a, b) => a - b))
        if (keys.length) assert.ok(keys.at(-1) - keys[0] <= 1)
        assert.equal(new Set(f.settled).size, f.settled.length)
    }
    assert.deepEqual(frames[0].queue, [{ vertex: 1, distance: 0 }])
})
test('random directed 0/1 graphs match Floyd, including zero cycles, self-loops, parallel edges and unreachable nodes', () => {
    for (let trial = 0; trial < 180; trial++) {
        const n = 1 + rand(8), edges = []
        for (let i = 0, m = rand(35); i < m; i++) edges.push({ from: 1 + rand(n), to: 1 + rand(n), weight: rand(2) })
        const s = 1 + rand(n), frames = zeroOneFrames(n, edges, s), expected = floyd(n, edges, s)
        assert.deepEqual(frames.at(-1).distances.slice(1), expected)
        for (const f of frames) for (const v of f.settled) assert.equal(f.distances[v], expected[v - 1])
        assert.ok(frames.filter(f => f.kind === 'relax').length <= edges.length)
        assert.ok(frames.filter(f => f.kind === 'pop').length <= n)
    }
})
test('four C++ programs compile and match independent shortest-path answers; path recovery works', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'rbook-bfs-'))
    try {
        const sources = {
            maze: 'book/search/bfs/maze.cpp', bfs: 'book/search/bfs/bfs_template.cpp',
            zero: 'book/search/zero_one_bfs/zero_one_bfs.cpp', tram: 'book/search/zero_one_bfs/main.cpp',
        }
        for (const [name, source] of Object.entries(sources)) execFileSync('g++', ['-std=c++17', '-O2', source, '-o', path.join(directory, name)])
        const run = (name, input) => execFileSync(path.join(directory, name), { input, encoding: 'utf8', timeout: 3000 }).trim().split(/\s+/).map(Number)
        assert.deepEqual(run('maze', '3\n001\n101\n100\n1 1 3 3\n'), [4])
        assert.deepEqual(run('maze', '1\n0\n1 1 1 1\n'), [0])
        assert.deepEqual(run('maze', '3\n010\n111\n010\n1 1 3 3\n'), [-1])
        assert.deepEqual(run('tram', '3 2 1\n2 2 3\n2 3 1\n2 1 2\n'), [0])
        assert.deepEqual(run('tram', '2 1 2\n0\n0\n'), [-1])
        assert.deepEqual(run('tram', '2 1 1\n0\n0\n'), [0])
        for (let trial = 0; trial < 90; trial++) {
            const n = 1 + rand(8), s = 1 + rand(n), edges = []
            for (let j = 0, m = rand(25); j < m; j++) edges.push({ from: 1 + rand(n), to: 1 + rand(n), weight: rand(2) })
            const expected = floyd(n, edges, s).map(d => Number.isFinite(d) ? d : -1)
            assert.deepEqual(run('zero', `${n} ${edges.length} ${s}\n${edges.map(e => `${e.from} ${e.to} ${e.weight}`).join('\n')}\n`), expected)
            const undirected = edges.flatMap(e => [{ ...e, weight: 1 }, { from: e.to, to: e.from, weight: 1 }])
            assert.deepEqual(run('bfs', `${n} ${edges.length}\n${edges.map(e => `${e.from} ${e.to}`).join('\n')}\n`), floyd(n, undirected, 1).map(d => Number.isFinite(d) ? d : -1))
            const target = 1 + rand(n), routes = Array.from({ length: n }, () => [])
            for (const e of edges) if (!routes[e.from - 1].includes(e.to)) routes[e.from - 1].push(e.to)
            const tramEdges = routes.flatMap((vs, u) => vs.map((v, j) => ({ from: u + 1, to: v, weight: j === 0 ? 0 : 1 })))
            const answer = floyd(n, tramEdges, s)[target - 1]
            assert.deepEqual(run('tram', `${n} ${s} ${target}\n${routes.map(vs => `${vs.length} ${vs.join(' ')}`).join('\n')}\n`), [Number.isFinite(answer) ? answer : -1])
            const side = 2 + rand(4), grid = Array.from({ length: side }, () => Array.from({ length: side }, () => rand(4) === 0 ? '1' : '0'))
            grid[0][0] = '0'; grid[side - 1][side - 1] = '0'
            const rows = grid.map(row => row.join('')), mazeExpected = gridOracle(rows, 0).at(-1)
            assert.deepEqual(run('maze', `${side}\n${rows.join('\n')}\n1 1 ${side} ${side}\n`), [mazeExpected])
        }
        const sourcePath = path.resolve(sources.bfs).replaceAll('\\', '/')
        const harness = `#define main lesson_main\n#include "${sourcePath}"\n#undef main\nint main(){n=5;g.assign(6,{});g[1]={2};g[2]={1,3};g[3]={2};bfs(1);for(int v:get_path(3))cout<<v<<' ';cout<<'\\n';cout<<get_path(5).size()<<'\\n';for(int v:get_path(1))cout<<v<<' ';}`
        writeFileSync(path.join(directory, 'path.cpp'), harness)
        execFileSync('g++', ['-std=c++17', '-O2', path.join(directory, 'path.cpp'), '-o', path.join(directory, 'path')])
        assert.deepEqual(run('path', ''), [1, 2, 3, 0, 1])
    } finally { rmSync(directory, { recursive: true, force: true }) }
})
