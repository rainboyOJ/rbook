/** Pure input and HLD logic shared by the view and its tests. */
export interface TreeInput {
    n: number
    root: number
    edges: Array<[number, number]>
}

export const MAX_NODES = 80

export const PRESETS = [
    { title: '文章示例 · 5 个点', input: '5 1\n1 2\n1 3\n3 4\n3 5' },
    { title: '不规则树 · 15 个点', input: '15 1\n1 2\n1 3\n1 4\n2 5\n2 6\n3 7\n4 8\n4 9\n5 10\n5 11\n7 12\n12 13\n9 14\n14 15' },
    { title: '平衡二叉树 · 15 个点', input: '15 1\n1 2\n1 3\n2 4\n2 5\n3 6\n3 7\n4 8\n4 9\n5 10\n5 11\n6 12\n6 13\n7 14\n7 15' },
    { title: '链形树 · 一条重链', input: '8 1\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 8' },
    { title: '星形树 · 多个轻儿子', input: '8 1\n1 2\n1 3\n1 4\n1 5\n1 6\n1 7\n1 8' },
    { title: '换一个根 · 根为 4', input: '5 4\n1 2\n1 3\n3 4\n3 5' },
    { title: '单点树', input: '1 1' },
] as const

export function parseTree(source: string): TreeInput {
    const lines = source.trim().split(/\r?\n/).filter(line => line.trim())
    if (!lines[0]) throw new Error('请输入树：第一行是 n root，接下来每行一条无向边 u v。')
    const pairs = lines.map((line, i) => {
        const tokens = line.trim().split(/\s+/)
        if (tokens.length !== 2 || tokens.some(token => !/^\d+$/.test(token))) {
            throw new Error(`第 ${i + 1} 个非空行需要两个整数，以空格分隔。`)
        }
        const pair = tokens.map(Number)
        if (pair.some(value => !Number.isSafeInteger(value))) throw new Error('输入的整数过大。')
        return pair as [number, number]
    })
    const [n, root] = pairs[0]
    if (n < 1 || n > MAX_NODES) throw new Error(`为保证图中文字可读，请输入 1～${MAX_NODES} 个节点。`)
    if (root < 1 || root > n) throw new Error(`根节点必须在 1～${n} 之间。`)
    const edges = pairs.slice(1)
    if (edges.length !== n - 1) throw new Error(`${n} 个节点需要 ${n - 1} 条边，当前输入了 ${edges.length} 条。`)
    const parent = Array.from({ length: n + 1 }, (_, u) => u)
    const find = (u: number): number => {
        while (u !== parent[u]) {
            parent[u] = parent[parent[u]]
            u = parent[u]
        }
        return u
    }
    for (const [u, v] of edges) {
        if (u < 1 || u > n || v < 1 || v > n) throw new Error(`边 ${u} ${v} 的端点必须在 1～${n} 之间。`)
        if (u === v) throw new Error(`边 ${u} ${v} 是自环，树中不能有自环。`)
        const a = find(u), b = find(v)
        if (a === b) throw new Error(`边 ${u} ${v} 形成环或重复边，请输入连通且无环的树。`)
        parent[a] = b
    }
    // n-1 successful unions on n vertices also prove connectivity.
    return { n, root, edges }
}

export function decompose(input: TreeInput) {
    const { n, root, edges } = input
    const adjacency: number[][] = Array.from({ length: n + 1 }, () => [])
    for (const [u, v] of edges) {
        adjacency[u].push(v)
        adjacency[v].push(u)
    }
    const zero = () => Array<number>(n + 1).fill(0)
    const parent = zero(), depth = zero(), size = zero(), heavy = zero(), top = zero(), dfn = zero(), rev = zero()
    const children: number[][] = Array.from({ length: n + 1 }, () => [])
    const order = [root]
    for (let i = 0; i < order.length; i++) {
        const u = order[i]
        for (const v of adjacency[u]) {
            if (v === parent[u]) continue
            parent[v] = u
            depth[v] = depth[u] + 1
            children[u].push(v)
            order.push(v)
        }
    }
    for (const u of [...order].reverse()) {
        size[u] = 1
        for (const v of children[u]) {
            size[u] += size[v]
            // Same tie rule as the article's C++ and Python templates.
            if (size[v] > size[heavy[u]]) heavy[u] = v
        }
    }
    // Same order as the article's dfs2: number u, recurse into the heavy son first,
    // then walk the light children in input order.
    let timer = 0
    const dfs2 = (u: number, head: number): void => {
        top[u] = head
        dfn[u] = ++timer
        rev[timer] = u
        if (heavy[u]) dfs2(heavy[u], head)
        for (const v of children[u]) {
            if (v === heavy[u]) continue
            dfs2(v, v)
        }
    }
    dfs2(root, root)
    const chains: number[][] = []
    for (const u of rev.slice(1)) {
        if (top[u] !== u) continue
        const chain: number[] = []
        for (let v = u; v; v = heavy[v]) chain.push(v)
        chains.push(chain)
    }
    return { ...input, parent, depth, size, heavy, top, dfn, rev, children, chains }
}

export type HldTree = ReturnType<typeof decompose>
