const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { TASKS, buildFrames } = require('../book/greedy/regret/regret-model.ts')

function feasible(tasks) {
    let total = 0
    for (const t of [...tasks].sort((a, b) => a.deadline - b.deadline)) {
        total += t.duration
        if (total > t.deadline) return false
    }
    return true
}
function bruteTasks(tasks) {
    let best = 0
    for (let mask = 0; mask < 2 ** tasks.length; mask++) {
        const chosen = tasks.filter((_, i) => mask & (1 << i))
        if (chosen.length > best && feasible(chosen)) best = chosen.length
    }
    return best
}
function brutePotions(values) {
    let best = 0
    for (let mask = 0; mask < 2 ** values.length; mask++) {
        let health = 0, count = 0, ok = true
        for (let i = 0; i < values.length; i++) if (mask & (1 << i)) {
            health += values[i]; count++
            if (health < 0) { ok = false; break }
        }
        if (ok) best = Math.max(best, count)
    }
    return best
}
let seed = 20261113
function random(n) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n }

test('animation computes both kinds of regret and a final executable plan', () => {
    const frames = buildFrames(), done = frames.at(-1)
    assert.equal(frames.length, 12)
    assert.deepEqual(frames.filter(f => f.kind === 'remove').map(f => f.discarded), ['A', 'E'])
    assert.deepEqual(done.selected, ['B', 'C', 'D'])
    assert.equal(done.total, 9)
    assert.equal(bruteTasks(TASKS), done.selected.length)
    assert.ok(frames.some(f => f.kind === 'add' && f.total > f.deadline))
})
test('each snapshot has a real max-heap; settled frames satisfy every deadline', () => {
    const frames = buildFrames(), byId = new Map(TASKS.map(t => [t.id, t]))
    for (const f of frames) {
        assert.deepEqual([...f.heap].sort(), [...f.selected].sort())
        assert.equal(f.total, f.heap.reduce((sum, id) => sum + byId.get(id).duration, 0))
        for (let i = 1; i < f.heap.length; i++) {
            assert.ok(byId.get(f.heap[(i - 1) >> 1]).duration >= byId.get(f.heap[i]).duration)
        }
        if (f.kind !== 'add') assert.ok(feasible(f.selected.map(id => byId.get(id))))
    }
    assert.deepEqual(frames[0].heap, [])
    assert.deepEqual(frames[1].heap, ['A'])
})
test('safe deletion preserves the global optimum, including tasks not yet scanned', () => {
    for (let trial = 0; trial < 140; trial++) {
        const tasks = Array.from({ length: 1 + random(8) }, (_, i) => ({ id: String(i), duration: 1 + random(10), deadline: random(22) }))
        const expected = bruteTasks(tasks)
        for (const frame of buildFrames(tasks).filter(f => f.kind === 'remove')) {
            assert.equal(bruteTasks(tasks.filter(t => !frame.removed.includes(t.id))), expected)
        }
        assert.equal(buildFrames(tasks).at(-1).selected.length, expected)
    }
})
test('both complete C++ programs match brute-force subsets and handle 64-bit totals', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'rbook-regret-'))
    try {
        const tasksBin = path.join(directory, 'tasks'), potionsBin = path.join(directory, 'potions')
        execFileSync('g++', ['-std=c++17', '-O2', 'book/greedy/regret/main.cpp', '-o', tasksBin])
        execFileSync('g++', ['-std=c++17', '-O2', 'book/greedy/regret/potions.cpp', '-o', potionsBin])
        const run = (bin, input) => Number(execFileSync(bin, { input, encoding: 'utf8', timeout: 3000 }).trim())
        assert.equal(run(tasksBin, '4\n100 200\n200 1300\n1000 1250\n2000 3200\n'), 3)
        assert.equal(run(potionsBin, '6\n4 -4 1 -3 1 -3\n'), 5)
        assert.equal(run(tasksBin, '2\n2000000000 2100000000\n2000000000 2147483647\n'), 1)
        assert.equal(run(potionsBin, '6\n1000000000 1000000000 1000000000 -1000000000 -1000000000 -1000000000\n'), 6)
        for (const values of [[-1, -2], [0, 0, 0], [-1, 10], [1, -1, -1], [4, -4, 1, -3, 1, -3]]) {
            assert.equal(run(potionsBin, `${values.length}\n${values.join(' ')}\n`), brutePotions(values))
        }
        for (let trial = 0; trial < 160; trial++) {
            const n = 1 + random(9)
            const tasks = Array.from({ length: n }, (_, i) => ({ id: String(i), duration: 1 + random(12), deadline: random(25) }))
            assert.equal(run(tasksBin, `${n}\n${tasks.map(t => `${t.duration} ${t.deadline}`).join('\n')}\n`), bruteTasks(tasks))
            const values = Array.from({ length: n }, () => random(17) - 8)
            assert.equal(run(potionsBin, `${n}\n${values.join(' ')}\n`), brutePotions(values))
        }
    } finally { rmSync(directory, { recursive: true, force: true }) }
})
