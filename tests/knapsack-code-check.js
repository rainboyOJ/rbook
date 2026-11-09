/**
 * knapsack-code-check.js — 背包各讲代码的编译 + 对拍
 *
 * 为什么要有这个脚本：文章里贴的每份 `.cpp` 都必须能编译、且答案正确。
 * `.out` 文件被 .gitignore 忽略（不能作为验证记录），所以把验证固化在这里：
 *   1. 编译各讲 code/ 下的每份 .cpp；
 *   2. 跑文章用的样例，与 EXPECTED 里写死的期望值比对；
 *   3. 随机小数据 + 暴力枚举对拍，覆盖状态转移写错、边界漏算等错误。
 *
 * 运行：node --test tests/knapsack-code-check.test.js（或直接 node 本文件）
 * 需要 g++。缺 g++ 时整组跳过，不算失败。
 */
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const KB = path.join(ROOT, 'book/dynamic_programming/knapsack')

/** 各程序在文章样例上的期望输出（第一个 token 是答案）。 */
const SAMPLES = [
    // 多重背包：三种写法必须一致
    { dir: 'multiple_knapsack', file: 'simple.cpp', input: 'in', expect: '11' },
    { dir: 'multiple_knapsack', file: 'binary.cpp', input: 'in', expect: '11' },
    { dir: 'multiple_knapsack', file: 'monotone_queue.cpp', input: 'in', expect: '11' },
    // 混合背包：三种写法必须一致
    { dir: 'mixed_knapsack', file: 'simple.cpp', input: 'in', expect: '20' },
    { dir: 'mixed_knapsack', file: 'one_dim.cpp', input: 'in', expect: '20' },
    { dir: 'mixed_knapsack', file: 'binary.cpp', input: 'in', expect: '20' },
    // 二维费用
    { dir: 'two_dim_cost', file: 'two_dim.cpp', input: 'in', expect: '9' },
    { dir: 'two_dim_cost', file: 'one_dim_group.cpp', input: 'in_group', expect: '16' },
    // 有依赖
    { dir: 'dependent_knapsack', file: 'tree_dp.cpp', input: 'in', expect: '17' },
    { dir: 'dependent_knapsack', file: 'main_attach.cpp', input: 'in_main', expect: '16' },
    // 问法变化
    { dir: 'scheme_count', file: 'count_schemes.cpp', input: 'in_schemes', expect: '4' },
    { dir: 'scheme_count', file: 'count_best.cpp', input: 'in_best', expect: '11 1', tokenCount: 2 },
    { dir: 'scheme_count', file: 'kth_best.cpp', input: 'in_kth', expect: '11 9', tokenCount: 2 },
]

let gpp = true
try {
    execFileSync('g++', ['--version'], { stdio: 'ignore' })
} catch {
    gpp = false
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kbcheck-'))

function compile(dir, file) {
    const src = path.join(KB, dir, 'code', file)
    const out = path.join(tmp, `${dir}-${file.replace(/\.cpp$/, '')}`)
    execFileSync('g++', ['-O2', '-std=c++17', '-o', out, src], { stdio: 'pipe' })
    return out
}

function run(exe, input) {
    return execFileSync(exe, { input, encoding: 'utf8' }).trim()
}

// ---------- 暴力参考实现 ----------

const brute = {
    /** 多重背包：每件 0..m */
    multi(items, cap) {
        let best = 0
        const go = (i, w, v) => {
            if (w > cap) return
            if (i === items.length) { best = Math.max(best, v); return }
            for (let k = 0; k <= items[i][2] && w + k * items[i][0] <= cap; k++) {
                go(i + 1, w + k * items[i][0], v + k * items[i][1])
            }
        }
        go(0, 0, 0)
        return best
    },
    /** 混合背包：p=0 无限，p>=1 至多 p 件 */
    mixed(items, cap) {
        let best = 0
        const go = (i, w, v) => {
            if (w > cap) return
            if (i === items.length) { best = Math.max(best, v); return }
            const [, , p] = items[i]
            const hi = p === 0 ? Math.floor(cap / items[i][0]) : Math.min(p, Math.floor(cap / items[i][0]))
            for (let k = 0; k <= hi; k++) {
                go(i + 1, w + k * items[i][0], v + k * items[i][1])
            }
        }
        go(0, 0, 0)
        return best
    },
    /** 二维费用：子集枚举 */
    twoDim(items, A, B) {
        let best = 0
        for (let mask = 0; mask < (1 << items.length); mask++) {
            let a = 0, b = 0, v = 0
            for (let i = 0; i < items.length; i++) {
                if (mask >> i & 1) { a += items[i][0]; b += items[i][1]; v += items[i][2] }
            }
            if (a <= A && b <= B) best = Math.max(best, v)
        }
        return best
    },
    /** 最多 K 件 */
    countLimit(items, cap, K) {
        let best = 0
        for (let mask = 0; mask < (1 << items.length); mask++) {
            let w = 0, v = 0, c = 0
            for (let i = 0; i < items.length; i++) {
                if (mask >> i & 1) { w += items[i][0]; v += items[i][1]; c++ }
            }
            if (w <= cap && c <= K) best = Math.max(best, v)
        }
        return best
    },
    /** 依赖闭合的子集 */
    dependent(items, cap) {
        let best = 0
        for (let mask = 0; mask < (1 << items.length); mask++) {
            let ok = true, w = 0, v = 0
            for (let i = 0; i < items.length; i++) {
                if (!(mask >> i & 1)) continue
                const p = items[i][2]
                if (p !== 0 && !(mask >> (p - 1) & 1)) { ok = false; break }
                w += items[i][0]; v += items[i][1]
            }
            if (ok && w <= cap) best = Math.max(best, v)
        }
        return best
    },
    /** 装满的方案数（完全背包） */
    schemes(ws, cap) {
        let cnt = 0
        const go = (i, rem) => {
            if (i === ws.length) { if (rem === 0) cnt++; return }
            for (let k = 0; k * ws[i] <= rem; k++) go(i + 1, rem - k * ws[i])
        }
        go(0, cap)
        return cnt
    },
    /** 最优方案数 */
    bestCount(items, cap) {
        let best = -1, cnt = 0
        for (let mask = 0; mask < (1 << items.length); mask++) {
            let w = 0, v = 0
            for (let i = 0; i < items.length; i++) {
                if (mask >> i & 1) { w += items[i][0]; v += items[i][1] }
            }
            if (w > cap) continue
            if (v > best) { best = v; cnt = 1 } else if (v === best) cnt++
        }
        return { best, cnt }
    },
    /** 第 K 优解（价值去重后降序） */
    kth(items, cap, K) {
        const vals = new Set()
        for (let mask = 0; mask < (1 << items.length); mask++) {
            let w = 0, v = 0
            for (let i = 0; i < items.length; i++) {
                if (mask >> i & 1) { w += items[i][0]; v += items[i][1] }
            }
            if (w <= cap) vals.add(v)
        }
        const desc = [...vals].sort((a, b) => b - a)
        return { best: desc[0], kth: K <= desc.length ? desc[K - 1] : desc[desc.length - 1] }
    },
}

/** 确定性伪随机，保证失败可复现。 */
function makeRandom(seed) {
    let s = seed >>> 0
    return (n) => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s % n
    }
}

const FORMAT = {
    multi: (items, cap) => `${items.length} ${cap}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
    mixed: (items, cap) => `${items.length} ${cap}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
    twoDim: (items, A, B) => `${items.length} ${A} ${B}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
    countLimit: (items, cap, K) => `${items.length} ${cap} ${K}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
    dependent: (items, cap) => `${items.length} ${cap}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
    schemes: (ws, cap) => `${ws.length} ${cap}\n` + ws.join('\n') + '\n',
    bestCount: (items, cap) => `${items.length} ${cap}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
    kth: (items, cap, K) => `${items.length} ${cap} ${K}\n` + items.map(i => i.join(' ')).join('\n') + '\n',
}

/** 对拍任务：程序 × 数据生成器 × 暴力参考。 */
const STRESS = [
    {
        name: '多重背包 simple/binary/单调队列',
        files: ['simple.cpp', 'binary.cpp', 'monotone_queue.cpp'],
        dir: 'multiple_knapsack',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(4), cap = 1 + rnd(12)
            const items = Array.from({ length: n }, () => [1 + rnd(6), 1 + rnd(9), 1 + rnd(4)])
            return { input: FORMAT.multi(items, cap), expect: String(brute.multi(items, cap)) }
        },
    },
    {
        name: '混合背包 simple/one_dim/binary',
        files: ['simple.cpp', 'one_dim.cpp', 'binary.cpp'],
        dir: 'mixed_knapsack',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(4), cap = 1 + rnd(12)
            const items = Array.from({ length: n }, () => [1 + rnd(6), 1 + rnd(9), [0, 1, 2, 3][rnd(4)]])
            return { input: FORMAT.mixed(items, cap), expect: String(brute.mixed(items, cap)) }
        },
    },
    {
        name: '二维费用 two_dim',
        files: ['two_dim.cpp'],
        dir: 'two_dim_cost',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(6), A = 1 + rnd(8), B = 1 + rnd(8)
            const items = Array.from({ length: n }, () => [1 + rnd(5), 1 + rnd(5), 1 + rnd(9)])
            return { input: FORMAT.twoDim(items, A, B), expect: String(brute.twoDim(items, A, B)) }
        },
    },
    {
        name: '件数限制 one_dim_group',
        files: ['one_dim_group.cpp'],
        dir: 'two_dim_cost',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(6), cap = 1 + rnd(10), K = 1 + rnd(3)
            const items = Array.from({ length: n }, () => [1 + rnd(5), 1 + rnd(9)])
            return { input: FORMAT.countLimit(items, cap, K), expect: String(brute.countLimit(items, cap, K)) }
        },
    },
    {
        name: '有依赖 tree_dp',
        files: ['tree_dp.cpp'],
        dir: 'dependent_knapsack',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(7), cap = 1 + rnd(12)
            const items = []
            for (let i = 1; i <= n; i++) {
                // 父亲编号必须小于自己，保证输入顺序即可拓扑
                const p = (i === 1 || rnd(2) === 0) ? 0 : 1 + rnd(i - 1)
                items.push([1 + rnd(5), 1 + rnd(9), p])
            }
            return { input: FORMAT.dependent(items, cap), expect: String(brute.dependent(items, cap)) }
        },
    },
    {
        name: '主件+至多2附件 main_attach',
        files: ['main_attach.cpp'],
        dir: 'dependent_knapsack',
        rounds: 150,
        gen(rnd) {
            // 这个模型要求：深度只有 1 层，且每个主件至多 2 个附件
            const nmain = 1 + rnd(3)
            const items = Array.from({ length: nmain }, () => [1 + rnd(5), 1 + rnd(9), 0])
            for (let m = 1; m <= nmain; m++) {
                const k = rnd(3)                       // 0..2 个附件
                for (let j = 0; j < k; j++) items.push([1 + rnd(5), 1 + rnd(9), m])
            }
            const cap = 1 + rnd(12)
            return { input: FORMAT.dependent(items, cap), expect: String(brute.dependent(items, cap)) }
        },
    },
    {
        name: '方案总数 count_schemes',
        files: ['count_schemes.cpp'],
        dir: 'scheme_count',
        rounds: 120,
        gen(rnd) {
            const n = 1 + rnd(3), cap = 1 + rnd(12)
            const ws = Array.from({ length: n }, () => 1 + rnd(6))
            return { input: FORMAT.schemes(ws, cap), expect: String(brute.schemes(ws, cap) % 1000000007) }
        },
    },
    {
        name: '最优方案数 count_best',
        files: ['count_best.cpp'],
        dir: 'scheme_count',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(6), cap = 1 + rnd(10)
            const items = Array.from({ length: n }, () => [1 + rnd(5), 1 + rnd(9)])
            const { best, cnt } = brute.bestCount(items, cap)
            return { input: FORMAT.bestCount(items, cap), expect: `${best} ${cnt % 1000000007}` }
        },
    },
    {
        name: '第 K 优解 kth_best',
        files: ['kth_best.cpp'],
        dir: 'scheme_count',
        rounds: 150,
        gen(rnd) {
            const n = 1 + rnd(6), cap = 1 + rnd(10), K = 1 + rnd(5)
            const items = Array.from({ length: n }, () => [1 + rnd(5), 1 + rnd(9)])
            const { best, kth } = brute.kth(items, cap, K)
            return { input: FORMAT.kth(items, cap, K), expect: `${best} ${kth}` }
        },
    },
]

module.exports = { SAMPLES, STRESS, gpp, compile, run, tmp, KB, makeRandom }
