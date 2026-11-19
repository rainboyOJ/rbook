const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const ts = require('typescript')

const dir = path.resolve(__dirname, '../book/data_structure/segment_tree/range-assign')
const compiled = ts.transpileModule(fs.readFileSync(path.join(dir, 'range-assign-model.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const model = {}
new Function('exports', compiled)(model)
const frames = model.buildFrames()
const stable = frames.filter(f => ['build', 'done', 'answer'].includes(f.kind))
const sample = '5 8\n1 -2 3 4 5\n2 1 5\n1 1 5 7\n2 2 4\n1 1 5 0\n2 3 3\n1 3 5 -2\n2 1 5\n2 4 5\n'

test('assignment snapshots preserve the logical array, including zero overrides', () => {
    const values = [...model.VALUES]
    for (const frame of stable) {
        const op = model.OPERATIONS[frame.operation - 1]
        if (frame.kind === 'done') values.fill(op.value, op.l - 1, op.r)
        const nodes = new Map(frame.nodes.map(n => [n.p, n]))
        for (const n of frame.nodes) {
            if (n.has) assert.equal(n.sum, n.lazy * (n.r - n.l + 1))
            else if (n.l !== n.r) assert.equal(n.sum, nodes.get(n.p * 2).sum + nodes.get(n.p * 2 + 1).sum)
            if (n.l === n.r) {
                let actual = n.sum
                // 上方仍有效的赋值比下方旧状态更新；最高的有效祖先最终生效。
                for (let p = Math.floor(n.p / 2); p; p = Math.floor(p / 2)) {
                    if (nodes.get(p).has) actual = nodes.get(p).lazy
                }
                assert.equal(actual, values[n.l - 1])
            }
        }
        assert.equal(nodes.get(1).sum, values.reduce((a, b) => a + b, 0))
        if (frame.kind === 'answer') assert.equal(frame.answers.at(-1), values.slice(op.l - 1, op.r).reduce((a, b) => a + b, 0))
    }
    const beforeZero = stable.find(f => f.operation === 3).nodes[0]
    assert.equal(beforeZero.has, false)
    assert.equal(beforeZero.lazy, 7) // 下传后残留的 7 不能重新生效。
    const zero = stable.find(f => f.operation === 4).nodes[0]
    assert.equal(zero.has, true)
    assert.equal(zero.lazy, 0)
    assert.ok(frames.some(f => f.operation === 5 && f.kind === 'pushdown'))
    assert.deepEqual(frames.at(-1).answers, [11, 21, 0, -6, -4])
    assert.equal(frames[0].nodes[0].sum, 11)
    assert.ok(frames.every(f => Object.isFrozen(f) && Object.isFrozen(f.nodes) && f.nodes.every(Object.isFrozen)))
    assert.deepEqual(model.buildFrames(), frames)
})

test('four-line labels fit the shared tree layout', () => {
    const layout = JSON.parse(fs.readFileSync(path.join(dir, '../update_range/tree-layout.json'), 'utf8'))
    assert.deepEqual(layout.nodes.map(n => n.p).sort((a, b) => a - b), frames[0].nodes.map(n => n.p).sort((a, b) => a - b))
    for (const n of layout.nodes) {
        assert.ok(n.x >= 68 && n.x + 68 <= layout.width)
        assert.ok(n.y >= 45 && n.y + 45 <= layout.height)
        for (const other of layout.nodes) {
            if (other.p !== n.p && other.y === n.y) assert.ok(Math.abs(other.x - n.x) >= 150)
        }
    }
    assert.equal(layout.edges.length, layout.nodes.length - 1)
})

test('C++ demo matches all snapshots; assignment template matches a plain array', { timeout: 30000 }, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rbook-range-assign-'))
    try {
        const core = fs.readFileSync(path.join(dir, 'range_assign.cpp'), 'utf8').split('int main() {')[0]
        assert.ok(fs.readFileSync(path.join(dir, 'range_assign_demo.cpp'), 'utf8').startsWith(core))
        for (const file of ['range_assign', 'range_assign_demo']) {
            execFileSync('g++', ['-std=c++17', '-O2', '-Wall', '-Wextra', path.join(dir, file + '.cpp'), '-o', path.join(tmp, file)])
        }
        const run = (file, input) => execFileSync(path.join(tmp, file), { input, encoding: 'utf8' })
        assert.equal(run('range_assign', sample).trim(), '11\n21\n0\n-6\n-4')
        const output = run('range_assign_demo', sample)
        const groups = []; let current
        for (const line of output.trimEnd().split('\n')) {
            const m = line.match(/^\s*node (\d+) \[(\d+),(\d+)\] sum=(-?\d+) lazy=(-?\d+) has=([01])$/)
            if (!m) { current = []; groups.push(current) }
            else current.push({ p: +m[1], l: +m[2], r: +m[3], sum: +m[4], lazy: +m[5], has: m[6] === '1' })
        }
        assert.equal(groups.length, stable.length)
        groups.forEach((nodes, i) => assert.deepEqual(nodes, stable[i].nodes))
        const md = fs.readFileSync(path.join(dir, 'index.md'), 'utf8')
        assert.ok(output.includes(md.match(/```text\n(after assign \[1,5\] value=0[\s\S]*?)```/)[1].trimEnd()))
        let seed = 20261116
        function rand(n) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return ((seed ^ (seed >>> 16)) >>> 0) % n }
        for (let t = 0; t < 80; t++) {
            const n = t === 0 ? 1 : rand(50) + 1
            const a = Array.from({ length: n }, () => rand(2001) - 1000)
            const input = [`${n} 160`, a.join(' ')], expected = []
            for (let i = 0; i < 160; i++) {
                let l = rand(n), r = rand(n); if (l > r) [l, r] = [r, l]
                if (rand(3) !== 0) {
                    const v = i % 4 === 0 ? 0 : rand(2001) - 1000
                    input.push(`1 ${l + 1} ${r + 1} ${v}`); a.fill(v, l, r + 1)
                } else {
                    input.push(`2 ${l + 1} ${r + 1}`); expected.push(a.slice(l, r + 1).reduce((x, y) => x + y, 0))
                }
            }
            assert.deepEqual(run('range_assign', input.join('\n') + '\n').trim().split(/\s+/), expected.map(String))
        }
        const n = 100000
        const input = `${n} 4\n${Array(n).fill(1).join(' ')}\n1 1 ${n} -1000000000\n2 1 ${n}\n1 2 ${n} 0\n2 1 ${n}\n`
        assert.equal(run('range_assign', input).trim(), '-100000000000000\n-1000000000')
    } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
})
