const { describe, it, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
    SAMPLES, STRESS, gpp, compile, run, tmp, KB, makeRandom,
} = require('./knapsack-code-check.js')

/**
 * 背包各讲文章里贴的每份代码都必须：能编译、样例输出对、随机对拍不翻车。
 * 这些断言守的是「文章里的代码是对的」——写错一个状态转移，这里就会红。
 */
describe('背包各讲代码可编译且答案正确', { skip: gpp ? false : '未安装 g++' }, () => {
    const exes = new Map()

    const exeOf = (dir, file) => {
        const key = `${dir}/${file}`
        if (!exes.has(key)) exes.set(key, compile(dir, file))
        return exes.get(key)
    }

    after(() => {
        fs.rmSync(tmp, { recursive: true, force: true })
    })

    it('每份 .cpp 都能编译', () => {
        for (const s of SAMPLES) {
            assert.ok(fs.existsSync(path.join(KB, s.dir, 'code', s.file)), `缺文件 ${s.dir}/${s.file}`)
            assert.ok(exeOf(s.dir, s.file), `${s.dir}/${s.file} 编译失败`)
        }
    })

    it('文章样例的输出与文中写的一致', () => {
        for (const s of SAMPLES) {
            const input = fs.readFileSync(path.join(KB, s.dir, 'code', s.input), 'utf8')
            const out = run(exeOf(s.dir, s.file), input).replace(/\s+/g, ' ').trim()
            // 有的程序输出两个数（最优解 + 第 K 优解 / 方案数），所以整行比对
            const want = s.tokenCount === 1 ? out.split(' ')[0] : out
            const expected = s.expect
            assert.equal(
                s.tokenCount === 1 ? want.split(' ')[0] : want, expected,
                `${s.dir}/${s.file} 在 ${s.input} 上输出 ${out}，文中写的是 ${expected}`,
            )
        }
    })

    it('同一讲的多种写法输出必须一致', () => {
        // 多重背包与混合背包各有三份实现，答案必须相同
        for (const [dir, files] of [
            ['multiple_knapsack', ['simple.cpp', 'binary.cpp', 'monotone_queue.cpp']],
            ['mixed_knapsack', ['simple.cpp', 'one_dim.cpp', 'binary.cpp']],
        ]) {
            const input = fs.readFileSync(path.join(KB, dir, 'code', 'in'), 'utf8')
            const outs = files.map(f => run(exeOf(dir, f), input))
            assert.equal(new Set(outs).size, 1, `${dir} 各写法不一致: ${JSON.stringify(outs)}`)
        }
    })

    // 每个对拍任务一条测试，失败时能直接看出是哪个程序错了
    for (const task of STRESS) {
        it(`随机对拍：${task.name}`, () => {
            const rnd = makeRandom(20260108)
            for (let round = 0; round < task.rounds; round++) {
                const { input, expect } = task.gen(rnd)
                for (const file of task.files) {
                    const got = run(exeOf(task.dir, file), input).replace(/\s+/g, ' ').trim()
                    assert.equal(
                        got, expect,
                        `${task.dir}/${file} 对拍失败\n输入:\n${input}期望 ${expect}，实得 ${got}`,
                    )
                }
            }
        })
    }
})
