/**
 * 分组背包「一维数组原地更新」演示的纯数据层。
 *
 * 文章要传达的思想是：
 *   用**一维数组** f[]，对每个容量 J 把组内每个物品都试一遍，
 *   然后 J 减一再试一遍 —— 全程只有这一行数组，后面的组直接覆盖前面的。
 *
 * 所以帧的粒度是「一组 × 一个容量 J」：
 *   一帧之内，组内所有物品都在这个 J 上试过一遍，
 *   帧里记下每个物品的试探结果（谁更新成功、更新成多少），
 *   以及试完之后 f[] 的完整快照。
 * 读者按「下一步」就能看到 J 从大到小移动，数组被原地覆盖。
 */

/** 一组物品：每项是 (重量, 价值)。 */
export type Group = readonly (readonly [number, number])[]

export interface GroupedSpec {
    /** 背包容量 */
    readonly capacity: number
    /** 各组物品 */
    readonly groups: readonly Group[]
}

/**
 * 用文章里的样例：容量 6，三组物品。期望答案是 9（见 in2.ans）。
 */
export const SPEC: GroupedSpec = {
    capacity: 6,
    groups: [
        [[3, 4], [2, 3], [4, 2]],
        [[1, 4], [2, 5]],
        [[4, 3]],
    ],
}

/** 在某个容量 J 上，组内某个物品的试探结果。 */
export interface ItemTrial {
    /** 组内第几个物品（0-based） */
    readonly itemIndex: number
    /** 该物品的重量与价值 */
    readonly weight: number
    readonly value: number
    /** 容量不够时为 true（j < w，直接跳过） */
    readonly skipped: boolean
    /** 读的是 f[j - w]，容量不够时为 -1 */
    readonly source: number
    /** 候选值 f[j-w] + v，容量不够时为 -1 */
    readonly candidate: number
    /** 是否真的把 f[j] 变大了 */
    readonly improved: boolean
}

/** 一帧：某组在某容量 J 上，试完组内所有物品后的状态。 */
export interface Frame {
    readonly kind: 'group-start' | 'capacity' | 'done'
    readonly groupIndex: number
    /** 当前容量；group-start 帧为 -1 */
    readonly capacity: number
    /** 本帧内组内各物品的试探（group-start 帧为空） */
    readonly trials: readonly ItemTrial[]
    /** 本帧结束后 f[] 的快照 */
    readonly snapshot: readonly number[]
    /** 本帧是否真的改变了 f[] */
    readonly changed: boolean
    readonly title: string
    readonly message: string
}

export interface GroupedResult {
    readonly frames: readonly Frame[]
    /** 每组处理完后的 f[] */
    readonly afterGroup: readonly (readonly number[])[]
    /** 最终答案 */
    readonly answer: number
}

const GROUP_COLOR_NAMES = ['第一组', '第二组', '第三组', '第四组', '第五组']

/**
 * 真实跑一遍一维分组背包，把每个 (组, 容量) 都记成一帧。
 *
 * 循环顺序就是文章强调的那个：
 *   外层 组 i → 中层 容量 J 从大到小 → 内层 组内每个物品
 * 容量必须倒序，否则同一组会被选多件。
 */
export function runGrouped(spec: GroupedSpec = SPEC): GroupedResult {
    const { capacity, groups } = spec
    const f = new Array<number>(capacity + 1).fill(0)
    const frames: Frame[] = []
    const afterGroup: number[][] = []

    frames.push({
        kind: 'group-start',
        groupIndex: 0,
        capacity: -1,
        trials: [],
        snapshot: [...f],
        changed: false,
        title: '初始状态',
        message: '只有一维数组 f[]，全部是 0。接下来逐组处理，每组都在这同一行上原地更新。',
    })

    groups.forEach((group, groupIndex) => {
        const name = GROUP_COLOR_NAMES[groupIndex] ?? `第 ${groupIndex + 1} 组`

        frames.push({
            kind: 'group-start',
            groupIndex,
            capacity: -1,
            trials: [],
            snapshot: [...f],
            changed: false,
            title: `开始处理${name}`,
            message: `组内有 ${group.length} 个物品。容量 J 从 ${capacity} 往下扫到 0，` +
                `每个 J 都把组内物品挨个试一遍。`,
        })

        for (let j = capacity; j >= 0; --j) {
            const trials: ItemTrial[] = []
            const before = f[j]

            group.forEach(([w, v], itemIndex) => {
                if (j < w) {
                    trials.push({
                        itemIndex, weight: w, value: v,
                        skipped: true, source: -1, candidate: -1, improved: false,
                    })
                    return
                }
                const source = j - w
                const candidate = f[source] + v
                const improved = candidate > f[j]
                if (improved) f[j] = candidate
                trials.push({
                    itemIndex, weight: w, value: v,
                    skipped: false, source, candidate, improved,
                })
            })

            const changed = f[j] !== before
            frames.push({
                kind: 'capacity',
                groupIndex,
                capacity: j,
                trials,
                snapshot: [...f],
                changed,
                title: `第 ${j} 格：J = ${j}`,
                message: changed
                    ? `f[${j}] 从 ${before} 变成 ${f[j]}。`
                    : `f[${j}] 保持 ${f[j]} 不变。`,
            })
        }

        afterGroup.push([...f])
    })

    frames.push({
        kind: 'done',
        groupIndex: groups.length - 1,
        capacity: capacity,
        trials: [],
        snapshot: [...f],
        changed: false,
        title: '全部处理完毕',
        message: `f[${capacity}] = ${f[capacity]}，这就是答案。整个过程中只用了这一行数组。`,
    })

    return { frames, afterGroup, answer: f[capacity] }
}

/**
 * 对照组：把容量改成**正序**会发生什么。
 * 同一组会被反复选中，答案偏大——这正是「必须倒序」的原因。
 */
export function runGroupedWrongOrder(spec: GroupedSpec = SPEC): number {
    const { capacity, groups } = spec
    const f = new Array<number>(capacity + 1).fill(0)
    for (const group of groups) {
        for (let j = 0; j <= capacity; ++j) {
            for (const [w, v] of group) {
                if (j >= w && f[j - w] + v > f[j]) f[j] = f[j - w] + v
            }
        }
    }
    return f[capacity]
}
