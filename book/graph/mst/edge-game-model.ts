export const VERTEX_COUNT = 5

export interface GameEdge {
    readonly id: number
    readonly u: number
    readonly v: number
    readonly weight: number
}

// 与正文的边列表保持相同顺序；边的编号与权值无关。
export const GAME_EDGES: readonly GameEdge[] = [
    { id: 1, u: 1, v: 2, weight: 1 },
    { id: 2, u: 2, v: 3, weight: 2 },
    { id: 3, u: 1, v: 3, weight: 2 },
    { id: 4, u: 3, v: 4, weight: 4 },
    { id: 5, u: 2, v: 4, weight: 5 },
    { id: 6, u: 4, v: 5, weight: 3 },
    { id: 7, u: 3, v: 5, weight: 6 },
    { id: 8, u: 1, v: 5, weight: 8 },
]

export interface SelectedPath {
    readonly nodes: readonly number[]
    readonly edges: readonly number[]
}

export interface SelectionStats {
    readonly edgeCount: number
    readonly components: number
    readonly weight: number
    readonly complete: boolean
}

export interface EdgeMove {
    readonly kind: 'added' | 'removed' | 'cycle'
    readonly edge: GameEdge
    readonly selected: ReadonlySet<number>
    readonly path: SelectedPath | null
}

// 寻找已选边中的真实路径，供判环提示使用；并查集父指针不代表图上的边。
function selectedPath(selected: ReadonlySet<number>, start: number, end: number): SelectedPath | null {
    const parent = Array<number>(VERTEX_COUNT + 1).fill(-1)
    const parentEdge = Array<number>(VERTEX_COUNT + 1).fill(0)
    const queue = [start]
    parent[start] = start
    for (let head = 0; head < queue.length; head++) {
        const u = queue[head]
        for (const edge of GAME_EDGES) {
            if (!selected.has(edge.id)) continue
            const v = edge.u === u ? edge.v : edge.v === u ? edge.u : 0
            if (!v || parent[v] !== -1) continue
            parent[v] = u
            parentEdge[v] = edge.id
            queue.push(v)
        }
    }
    if (parent[end] === -1) return null
    const nodes = [end]
    const edges: number[] = []
    for (let u = end; u !== start; u = parent[u]) {
        edges.push(parentEdge[u])
        nodes.push(parent[u])
    }
    return { nodes: nodes.reverse(), edges: edges.reverse() }
}

export function toggleGameEdge(selected: ReadonlySet<number>, edgeId: number): EdgeMove {
    const edge = GAME_EDGES.find(item => item.id === edgeId)
    if (!edge) throw new RangeError(`未知边：${edgeId}`)
    if (selected.has(edgeId)) {
        const next = new Set(selected)
        next.delete(edgeId)
        return { kind: 'removed', edge, selected: next, path: null }
    }
    const path = selectedPath(selected, edge.u, edge.v)
    if (path) return { kind: 'cycle', edge, selected, path }
    return { kind: 'added', edge, selected: new Set([...selected, edgeId]), path: null }
}

export function selectionStats(selected: ReadonlySet<number>): SelectionStats {
    // 允许任意取消已选边，因此每次都按当前边集重新计算连通块。
    const parent = Array.from({ length: VERTEX_COUNT + 1 }, (_, i) => i)
    const find = (start: number) => {
        let u = start
        while (parent[u] !== u) u = parent[u]
        return u
    }
    let components = VERTEX_COUNT
    let edgeCount = 0
    let weight = 0
    for (const edge of GAME_EDGES) {
        if (!selected.has(edge.id)) continue
        edgeCount++
        weight += edge.weight
        const u = find(edge.u), v = find(edge.v)
        if (u !== v) {
            parent[u] = v
            components--
        }
    }
    return { edgeCount, components, weight, complete: components === 1 && edgeCount === VERTEX_COUNT - 1 }
}
