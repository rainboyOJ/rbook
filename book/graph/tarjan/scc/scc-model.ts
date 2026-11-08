/**
 * Tarjan SCC 演示用的图数据与算法，与渲染完全分离，可在 node 中直接断言。
 *
 * 图取自文章 `index.md` 里那张有分支的 DFS 树（assets/dfs-tree.svg）：
 * 从 1 开始 DFS，访问顺序 1、3、4、6、5、2，三个分量 A={1,2,3,4}、B={5}、C={6}。
 * 建边顺序刻意写成「1->3 在 1->2 之前」，让 DFS 走出与文章一致的顺序。
 */

export interface SccNodeSpec {
    readonly id: number
    /** 图布局坐标（第一幕「原始有向图」使用）。 */
    readonly x: number
    readonly y: number
    /** DFS 树布局坐标（第二幕之后使用）。 */
    readonly tx: number
    readonly ty: number
}

export interface SccEdgeSpec {
    readonly from: number
    readonly to: number
}

/**
 * 节点坐标同一套画布上放两种布局（逻辑画布 560 x 470）：
 * - (x, y)：第一幕原始有向图，按参考图 rbook_old 的网格摆：
 *   1/3 在上排、2/4 在下排、5/6 在右侧上下两格。全直线，无曲线绕行。
 * - (tx, ty)：第二幕之后的 DFS 树，1 是根，子 3、2；3 的子 4、5；4 的子 6。
 *
 * 两组坐标都经 tests/scc-animation.test.js 验算：
 * 包围圆互不相交、互不包含，且全部落在画布内。
 */
export const NODES: readonly SccNodeSpec[] = [
    { id: 1, x: 150, y: 150, tx: 280, ty: 90 },
    { id: 3, x: 330, y: 150, tx: 210, ty: 160 },
    { id: 2, x: 150, y: 330, tx: 350, ty: 160 },
    { id: 4, x: 330, y: 330, tx: 280, ty: 230 },
    { id: 5, x: 500, y: 150, tx: 110, ty: 290 },
    { id: 6, x: 500, y: 330, tx: 280, ty: 380 },
]

/** 建边顺序 = 链式前向星逆序后的出边遍历顺序，决定 DFS 走位。 */
export const EDGES: readonly SccEdgeSpec[] = [
    { from: 1, to: 3 },
    { from: 1, to: 2 },
    { from: 3, to: 4 },
    { from: 3, to: 5 },
    { from: 4, to: 6 },
    { from: 4, to: 1 },
    { from: 2, to: 4 },
    { from: 5, to: 6 },
]

export interface TarjanResult {
    /** dfn[u]：访问序号。 */
    readonly dfn: Readonly<Record<number, number>>
    /** low[u]：能退回的最早序号。 */
    readonly low: Readonly<Record<number, number>>
    /** 树边（按 DFS 发现顺序）。 */
    readonly treeEdges: readonly SccEdgeSpec[]
    /** 每个分量的点集，按出栈先后排列。 */
    readonly components: readonly (readonly number[])[]
    /** 每个分量的根，与 components 一一对应。 */
    readonly roots: readonly number[]
    /** 点 -> 分量下标（按出栈顺序编号，与文章 Tarjan 版一致）。 */
    readonly color: Readonly<Record<number, number>>
}

/** 真实跑一遍 Tarjan。测试直接断言它的输出，动画只消费结果。 */
export function runTarjan(
    nodes: readonly SccNodeSpec[] = NODES,
    edges: readonly SccEdgeSpec[] = EDGES,
): TarjanResult {
    const ids = nodes.map(n => n.id).sort((a, b) => a - b)
    const adj = new Map<number, number[]>(ids.map(id => [id, []]))
    for (const e of edges) adj.get(e.from)?.push(e.to)

    const dfn: Record<number, number> = {}
    const low: Record<number, number> = {}
    const color: Record<number, number> = {}
    const treeEdges: SccEdgeSpec[] = []
    const components: number[][] = []
    const roots: number[] = []
    const stack: number[] = []
    const inStack = new Set<number>()
    let timer = 0

    function dfs(u: number): void {
        dfn[u] = low[u] = ++timer
        stack.push(u)
        inStack.add(u)
        for (const v of adj.get(u) ?? []) {
            if (dfn[v] === undefined) {
                treeEdges.push({ from: u, to: v })
                dfs(v)
                low[u] = Math.min(low[u], low[v])
            } else if (inStack.has(v)) {
                low[u] = Math.min(low[u], dfn[v])
            }
        }
        if (low[u] === dfn[u]) {
            const index = components.length
            const component: number[] = []
            let t: number
            do {
                t = stack.pop() as number
                inStack.delete(t)
                color[t] = index
                component.push(t)
            } while (t !== u)
            component.sort((a, b) => a - b)
            components.push(component)
            roots.push(u)
        }
    }

    for (const id of ids) if (dfn[id] === undefined) dfs(id)
    return { dfn, low, treeEdges, components, roots, color }
}

/** 边是否进入了 DFS 树。 */
export function isTreeEdge(edge: SccEdgeSpec, tree: readonly SccEdgeSpec[]): boolean {
    return tree.some(t => t.from === edge.from && t.to === edge.to)
}

/** 边是否属于某个分量内部（同色两端）。 */
export function isInternalEdge(
    edge: SccEdgeSpec,
    color: Readonly<Record<number, number>>,
): boolean {
    return color[edge.from] === color[edge.to]
}

/** 缓动函数：ease-in-out（三次），供位移插值使用。 */
export function easeInOut(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** 线性插值。 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

/** 一幕的显示状态。帧序列放这里，便于 node 里直接断言。 */
export interface SccFrame {
    /** true 表示这一幕处于 DFS 树布局。 */
    readonly treeLayout: boolean
    /** 是否在节点旁显示 dfn 小字（第三幕起为 true）。 */
    readonly showDfn: boolean
    /** 已揭晓的分量数：0 表示尚未开始圈分量。 */
    readonly revealed: number
    readonly title: string
    readonly message: string
}

/**
 * 六帧：原始图 → DFS 树 → 标出 dfn → 三个分量依次圈出。
 *
 * 第三幕（标 dfn）单独占一帧，因为「谁是分量根」要靠 dfn 才看得出，
 * 而分量是后一幕才圈的。
 */
export function buildFrames(result: TarjanResult): readonly SccFrame[] {
    const frames: SccFrame[] = [
        {
            treeLayout: false,
            showDfn: false,
            revealed: 0,
            title: '第 1 幕 · 原始有向图',
            message: '一张普通的有向图。此刻先不标颜色——哪些点是强连通的，正是后面要算的答案。',
        },
        {
            treeLayout: true,
            showDfn: false,
            revealed: 0,
            title: '第 2 幕 · 变成 DFS 树',
            message: '从点 1 出发 DFS，访问顺序是 1、3、4、6、5、2。实线是树边，淡虚线是没进树的边。',
        },
        {
            treeLayout: true,
            showDfn: true,
            revealed: 0,
            title: '第 3 幕 · 标出 dfn',
            message: '每个点旁标出访问序号 dfn。dfn 最小的点就是它所在分量的根，后面圈分量时按出栈顺序来。',
        },
    ]

    const reasons = [
        '点 6 先退栈：low[6] = dfn[6] = 4，它是自己分量的根，弹出 {6}。',
        '点 5 退栈：low[5] = dfn[5] = 5，5 → 6 的终点已出栈，不更新 low，弹出 {5}。',
        '点 1 最后退栈：low[1] = dfn[1] = 1，弹出剩下的 3、2、1，它们与 4 同属一个分量。',
    ]
    for (let revealed = 1; revealed <= result.components.length; revealed++) {
        const index = revealed - 1
        frames.push({
            treeLayout: true,
            showDfn: true,
            revealed,
            title: `第 4 幕 · 第 ${revealed} 个出栈的分量`,
            message: `{${result.components[index].join(',')}} 是这个分量的点。${reasons[index]}`,
        })
    }

    return Object.freeze(frames)
}
