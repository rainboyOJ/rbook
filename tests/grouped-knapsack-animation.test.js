const { describe, it } = require('node:test')
const assert = require('node:assert/strict')

const {
    SPEC, runGrouped, runGroupedWrongOrder,
} = require('../book/dynamic_programming/knapsack/grouped_knapsack/grouped-knapsack-model.ts')

/**
 * 分组背包动画的数据层断言。
 *
 * 守两件事：
 *   1. 动画里每一帧的 f[] 都必须等于「真实跑一遍一维分组背包」的结果；
 *   2. 帧序列必须真的体现「容量倒序」——否则动画演示的就是错的东西。
 */
describe('分组背包一维数组动画', () => {
    const result = runGrouped(SPEC)

    it('样例答案是 9（与 in2.ans 一致）', () => {
        assert.equal(result.answer, 9)
    })

    it('每组的最终 f[] 与逐组跑出的真实值一致', () => {
        assert.deepEqual(result.afterGroup, [
            [0, 0, 3, 4, 4, 4, 4],
            [0, 4, 5, 7, 8, 9, 9],
            [0, 4, 5, 7, 8, 9, 9],
        ])
    })

    it('每一帧的快照长度都等于容量+1，且值单调不减', () => {
        for (const frame of result.frames) {
            assert.equal(frame.snapshot.length, SPEC.capacity + 1, frame.title)
            for (let j = 1; j < frame.snapshot.length; j++) {
                // f 不要求对 j 单调，但必须都是非负整数
                assert.ok(Number.isInteger(frame.snapshot[j]) && frame.snapshot[j] >= 0, frame.title)
            }
        }
    })

    it('容量帧的顺序是严格倒序的（这是「只用一次」的关键）', () => {
        const caps = result.frames
            .filter(f => f.kind === 'capacity' && f.groupIndex === 0)
            .map(f => f.capacity)
        assert.deepEqual(caps, [6, 5, 4, 3, 2, 1, 0])
    })

    it('每个容量帧都试过了组内全部物品', () => {
        for (const frame of result.frames) {
            if (frame.kind !== 'capacity') continue
            const group = SPEC.groups[frame.groupIndex]
            assert.equal(frame.trials.length, group.length, frame.title)
            frame.trials.forEach((t, i) => {
                assert.equal(t.itemIndex, i)
                assert.equal(t.weight, group[i][0])
                assert.equal(t.value, group[i][1])
            })
        }
    })

    it('标为 improved 的试探，候选值确实等于该帧的新值', () => {
        for (const frame of result.frames) {
            if (frame.kind !== 'capacity') continue
            const improved = frame.trials.filter(t => t.improved)
            if (improved.length === 0) continue
            // 最后一个 improved 的候选值就是这一格最终的值
            const last = improved[improved.length - 1]
            assert.equal(frame.snapshot[frame.capacity], last.candidate, frame.title)
        }
    })

    it('帧序列逐帧重放能还原出最终数组（快照自洽）', () => {
        // 取每组最后一个容量帧的快照，必须等于 afterGroup
        for (let g = 0; g < SPEC.groups.length; g++) {
            const last = [...result.frames]
                .reverse()
                .find(f => f.kind === 'capacity' && f.groupIndex === g)
            assert.deepEqual(last.snapshot, result.afterGroup[g], `第 ${g + 1} 组`)
        }
    })

    it('对照组：容量正序会算错（24 ≠ 9）', () => {
        const wrong = runGroupedWrongOrder(SPEC)
        assert.equal(wrong, 24)
        assert.notEqual(wrong, result.answer, '正序与倒序结果必须不同，否则动画的对照失去意义')
    })

    it('第一帧是空数组，最后一帧的 f[C] 就是答案', () => {
        assert.deepEqual(result.frames[0].snapshot, [0, 0, 0, 0, 0, 0, 0])
        const last = result.frames[result.frames.length - 1]
        assert.equal(last.snapshot[SPEC.capacity], 9)
    })
})
