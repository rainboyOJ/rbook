export interface Edge { from: number; to: number; weight: 0 | 1 }
export const EDGES: readonly Edge[] = [
    { from: 1, to: 2, weight: 0 }, { from: 1, to: 3, weight: 1 },
    { from: 1, to: 4, weight: 1 }, { from: 2, to: 3, weight: 0 }, { from: 3, to: 4, weight: 0 },
]
export interface Entry { vertex: number; distance: number }
export interface ZeroOneFrame {
    kind: 'start' | 'pop' | 'relax' | 'skip' | 'done'
    current: number | null
    edge: number | null
    distances: number[]
    queue: Entry[]
    settled: number[]
    message: string
}
export function zeroOneFrames(n = 4, edges: readonly Edge[] = EDGES, source = 1): ZeroOneFrame[] {
    const distances = Array(n + 1).fill(Infinity) as number[]
    const queue: Entry[] = [{ vertex: source, distance: 0 }], settled: number[] = [], frames: ZeroOneFrame[] = []
    distances[source] = 0
    const record = (kind: ZeroOneFrame['kind'], current: number | null, edge: number | null, message: string) => {
        frames.push({ kind, current, edge, distances: [...distances], queue: queue.map(e => ({ ...e })), settled: [...settled], message })
    }
    record('start', null, null, `dist[${source}]=0，其它距离为 ∞。队列条目写作“顶点@入队距离”。`)
    while (queue.length) {
        const entry = queue.shift()!, u = entry.vertex
        if (entry.distance !== distances[u]) {
            record('skip', u, null, `弹出旧条目 ${u}@${entry.distance}，但 dist[${u}]=${distances[u]}；该条目已过期，跳过，不扫描邻边。`)
            continue
        }
        settled.push(u)
        record('pop', u, null, `弹出有效条目 ${u}@${entry.distance}。它在剩余条目中距离最小，现在 dist[${u}] 才最终确定。`)
        edges.forEach((edge, index) => {
            if (edge.from !== u) return
            const next = entry.distance + edge.weight
            if (next >= distances[edge.to]) return
            const old = distances[edge.to]; distances[edge.to] = next
            const added = { vertex: edge.to, distance: next }
            if (edge.weight === 0) queue.unshift(added); else queue.push(added)
            record('relax', u, index, `沿 ${u}→${edge.to}（权 ${edge.weight}），dist[${edge.to}] 从 ${Number.isFinite(old) ? old : '∞'} 改为 ${next}；新条目 ${edge.to}@${next} 放入队${edge.weight === 0 ? '头' : '尾'}。旧条目若仍在队列中，保留到出队时跳过。`)
        })
    }
    record('done', null, null, `队列为空，所有可达点的最短费用已经确定：${distances.slice(1).map((d, i) => `${i + 1}:${Number.isFinite(d) ? d : '∞'}`).join('，')}。`)
    return frames
}
