const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const ts = require('typescript')

const dir = path.resolve(__dirname, '../book/data_structure/segment_tree/update_range')
const compiled = ts.transpileModule(fs.readFileSync(path.join(dir, 'range-add-model.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const model = {}
new Function('exports', compiled)(model)
const frames = model.buildFrames()
const stable = frames.filter(f => ['build', 'done', 'answer'].includes(f.kind))
const sample = '5 6\n1 -2 3 4 5\n2 1 5\n1 1 5 2\n2 2 4\n1 3 5 -1\n2 1 5\n2 3 3\n'

test('lazy snapshots preserve the logical array and the local sum invariant', () => {
    const values = [...model.VALUES]
    for (const frame of stable) {
        const op = model.OPERATIONS[frame.operation - 1]
        if (frame.kind === 'done') {
            for (let i = op.l - 1; i < op.r; i++) values[i] += op.value
        }
        const nodes = new Map(frame.nodes.map(n => [n.p, n]))
        for (const n of frame.nodes) {
            if (n.l !== n.r) {
                assert.equal(n.sum, nodes.get(n.p * 2).sum + nodes.get(n.p * 2 + 1).sum + n.lazy * (n.r - n.l + 1))
            } else {
                let actual = n.sum
                for (let p = Math.floor(n.p / 2); p; p = Math.floor(p / 2)) actual += nodes.get(p).lazy
                assert.equal(actual, values[n.l - 1])
            }
        }
        assert.equal(nodes.get(1).sum, values.reduce((a, b) => a + b, 0))
        if (frame.kind === 'answer') assert.equal(frame.answers.at(-1), values.slice(op.l - 1, op.r).reduce((a, b) => a + b, 0))
    }
    assert.deepEqual(frames.at(-1).answers, [11, 11, 18, 4])
    assert.equal(frames[0].nodes.find(n => n.p === 1).sum, 11)
    assert.ok(frames.every(f => Object.isFrozen(f) && Object.isFrozen(f.nodes) && f.nodes.every(Object.isFrozen)))
    assert.deepEqual(model.buildFrames(), frames)
})

test('stored geometry contains all nodes and separates same-level labels', () => {
    const layout = JSON.parse(fs.readFileSync(path.join(dir, 'tree-layout.json'), 'utf8'))
    assert.deepEqual(layout.nodes.map(n => n.p).sort((a, b) => a - b), frames[0].nodes.map(n => n.p).sort((a, b) => a - b))
    for (const n of layout.nodes) {
        assert.ok(n.x >= 68 && n.x + 68 <= layout.width)
        assert.ok(n.y >= 36 && n.y + 36 <= layout.height)
        for (const other of layout.nodes) {
            if (other.p !== n.p && other.y === n.y) assert.ok(Math.abs(other.x - n.x) >= 150)
        }
    }
    assert.equal(layout.edges.length, layout.nodes.length - 1)
})

test('both C++ programs agree with the lesson and demo states match animation snapshots', { timeout: 30000 }, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-range-add-'))
    try {
        const core = fs.readFileSync(path.join(dir, 'range_add.cpp'), 'utf8').split('int main() {')[0]
        assert.ok(fs.readFileSync(path.join(dir, 'range_add_demo.cpp'), 'utf8').startsWith(core))
        for (const file of ['range_add', 'range_add_demo']) {
            execFileSync('g++', ['-std=c++17', '-O2', '-Wall', '-Wextra', path.join(dir, file + '.cpp'), '-o', path.join(tmp, file)])
        }
        const run = (file, input) => execFileSync(path.join(tmp, file), { input, encoding: 'utf8' })
        assert.equal(run('range_add', sample).trim(), '11\n11\n18\n4')
        const output = run('range_add_demo', sample)
        const groups = []; let current
        for (const line of output.trimEnd().split('\n')) {
            const m = line.match(/^\s*node (\d+) \[(\d+),(\d+)\] sum=(-?\d+) lazy=(-?\d+)$/)
            if (!m) { current = []; groups.push(current) }
            else current.push({ p: +m[1], l: +m[2], r: +m[3], sum: +m[4], lazy: +m[5] })
        }
        assert.equal(groups.length, stable.length)
        groups.forEach((nodes, i) => assert.deepEqual(nodes, stable[i].nodes))
        const md = fs.readFileSync(path.join(dir, 'index.md'), 'utf8')
        const excerpt = md.match(/```text\n(after add \[1,5\][\s\S]*?)```/)[1]
        assert.ok(output.includes(excerpt.trimEnd()))
        assert.equal(run('range_add', '1 5\n-7\n1 1 1 0\n2 1 1\n1 1 1 -3\n2 1 1\n2 1 1\n').trim(), '-7\n-10\n-10')
    } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
})
