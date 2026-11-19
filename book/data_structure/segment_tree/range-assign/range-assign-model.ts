// 教学样例固定为五个元素，所有步骤都保存真实的 sum/lazy/has 快照。
export const VALUES = [1, -2, 3, 4, 5] as const
export const OPERATIONS = [
    { kind: 'query', l: 1, r: 5 },
    { kind: 'assign', l: 1, r: 5, value: 7 },
    { kind: 'query', l: 2, r: 4 },
    { kind: 'assign', l: 1, r: 5, value: 0 },
    { kind: 'query', l: 3, r: 3 },
    { kind: 'assign', l: 3, r: 5, value: -2 },
    { kind: 'query', l: 1, r: 5 },
    { kind: 'query', l: 4, r: 5 },
] as const

export interface NodeState {
    readonly p: number
    readonly l: number
    readonly r: number
    readonly sum: number
    readonly lazy: number
    readonly has: boolean
}
export interface Frame {
    readonly kind: 'build' | 'operation' | 'apply' | 'pushdown' | 'pull' | 'take' | 'skip' | 'answer' | 'done'
    readonly operation: number
    readonly title: string
    readonly message: string
    readonly nodes: readonly NodeState[]
    readonly active: readonly number[]
    readonly answers: readonly number[]
}

export function buildFrames(): readonly Frame[] {
    const nodes = new Map<number, { p: number; l: number; r: number; sum: number; lazy: number; has: boolean }>()
    const frames: Frame[] = [], answers: number[] = []
    let operation = 0
    function save(kind: Frame['kind'], title: string, message: string, active: number[] = []) {
        frames.push(Object.freeze({ kind, operation, title, message,
            nodes: Object.freeze([...nodes.values()].map(n => Object.freeze({ ...n }))),
            active: Object.freeze([...active]), answers: Object.freeze([...answers]),
        }))
    }
    function build(p: number, l: number, r: number): void {
        const node = { p, l, r, sum: 0, lazy: 0, has: false }
        nodes.set(p, node)
        if (l === r) node.sum = VALUES[l - 1]
        else {
            const mid = Math.floor((l + r) / 2)
            build(p * 2, l, mid); build(p * 2 + 1, mid + 1, r)
            node.sum = nodes.get(p * 2)!.sum + nodes.get(p * 2 + 1)!.sum
        }
    }
    function apply(p: number, value: number): void {
        const node = nodes.get(p)!
        node.sum = value * (node.r - node.l + 1)
        node.lazy = value
        node.has = true
    }
    function pushdown(p: number): void {
        const node = nodes.get(p)!, value = node.lazy
        if (!node.has) return
        apply(p * 2, value); apply(p * 2 + 1, value)
        node.has = false
        save('pushdown', `下传节点 ${p} 的赋值 ${value}`,
            `两个孩子被统一赋为 ${value}，旧标记被覆盖。父节点 has 清零，sum 保持 ${node.sum}；残留的 lazy 不再有效。`, [p, p * 2, p * 2 + 1])
    }
    function assign(p: number, L: number, R: number, value: number): void {
        const node = nodes.get(p)!
        if (node.r < L || R < node.l) {
            save('skip', `区间 [${node.l},${node.r}] 不相交`, '直接返回，不修改节点，也不下传标记。', [p])
            return
        }
        if (L <= node.l && node.r <= R) {
            apply(p, value)
            save('apply', `完整覆盖 [${node.l},${node.r}]`,
                `sum 改为 ${value} × ${node.r - node.l + 1}，lazy 覆盖为 ${value}，has 置为 1。在此停止，不再访问孩子。`, [p])
            return
        }
        pushdown(p)
        assign(p * 2, L, R, value)
        assign(p * 2 + 1, L, R, value)
        node.sum = nodes.get(p * 2)!.sum + nodes.get(p * 2 + 1)!.sum
        save('pull', `回溯更新节点 ${p}`, '部分修改后，两个孩子的信息已经补齐，执行 pushup 重新求和。', [p])
    }
    function query(p: number, L: number, R: number): number {
        const node = nodes.get(p)!
        if (node.r < L || R < node.l) {
            save('skip', `区间 [${node.l},${node.r}] 不相交`, '返回 0，不下传、不继续递归。', [p])
            return 0
        }
        if (L <= node.l && node.r <= R) {
            save('take', `取出 [${node.l},${node.r}] 的和 ${node.sum}`, '完整覆盖，sum 已经反映该节点的赋值，直接返回。', [p])
            return node.sum
        }
        pushdown(p)
        return query(p * 2, L, R) + query(p * 2 + 1, L, R)
    }
    build(1, 1, VALUES.length)
    save('build', '初始建树', '数组为 [1,-2,3,4,5]，根的 sum 为 11，所有 has 为 0，表示没有待下传的赋值。')
    OPERATIONS.forEach((op, i) => {
        operation = i + 1
        save('operation', op.kind === 'assign' ? `操作 ${operation}：区间 [${op.l},${op.r}] 赋为 ${op.value}` : `操作 ${operation}：查询 [${op.l},${op.r}]`,
            '框线加粗的节点表示本步正在处理；图中展示实际存储值，孩子可能尚未同步祖先赋值；has=0 时，lazy 的旧值无效。')
        if (op.kind === 'assign') {
            assign(1, op.l, op.r, op.value)
            save('done', `操作 ${operation}：修改完成`, `根的 sum 为 ${nodes.get(1)!.sum}。标记可以留在完整覆盖的节点上，不必全部传到叶子。`, [1])
        } else {
            const answer = query(1, op.l, op.r)
            answers.push(answer)
            save('answer', `操作 ${operation}：查询结果 ${answer}`, '查询可能下传标记，但数组本身没有改变，不需要额外上推。')
        }
    })
    return Object.freeze(frames)
}
