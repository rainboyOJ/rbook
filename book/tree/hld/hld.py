# Python 3.8+；全局列表与函数。节点、区间均为 1 下标。
# init(n, mod) -> 填 a / add_edge -> build(root) -> 路径与子树操作。
# 一次维护一棵静态树；新数据必须重新 init。mod 为正整数。

def init(count, modulus):
    global n, mod, g, fa, dep, sz, son, top, dfn, rev, a, base, tr, lazy
    n, mod = count, modulus
    g = [[] for _ in range(n + 1)]
    fa = [0] * (n + 1)
    dep = [0] * (n + 1)
    sz = [0] * (n + 1)
    son = [0] * (n + 1)
    top = [0] * (n + 1)
    dfn = [0] * (n + 1)
    rev = [0] * (n + 1)
    a = [0] * (n + 1)
    base = [0] * (n + 1)
    tr = [0] * (4 * n + 5)
    lazy = [0] * (4 * n + 5)


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def apply(u, l, r, a):
    a %= mod
    # 区间长度是 r - l + 1；先取模再加，防止数值无限增长。
    tr[u] = (tr[u] + a * (r - l + 1)) % mod
    lazy[u] = (lazy[u] + a) % mod

def pushdown(u, l, r):
    # 叶节点没有儿子可下传；lazy 为 0 时无事可做。
    if lazy[u] == 0 or l == r:
        return
    mid = (l + r) >> 1  # 除以 2 向下取整
    apply(u << 1, l, mid, lazy[u])  # 左儿子编号 2u
    apply(u << 1 | 1, mid + 1, r, lazy[u])  # 右儿子编号 2u+1
    lazy[u] = 0

def seg_build(u, l, r, base):
    if l == r:
        tr[u] = base[l] % mod
        return
    mid = (l + r) >> 1
    seg_build(u << 1, l, mid, base)
    seg_build(u << 1 | 1, mid + 1, r, base)
    tr[u] = (tr[u << 1] + tr[u << 1 | 1]) % mod

def range_add(ql, qr, a, u, l, r):
    if ql <= l and r <= qr:
        apply(u, l, r, a)
        return
    pushdown(u, l, r)
    mid = (l + r) >> 1
    if ql <= mid:
        range_add(ql, qr, a, u << 1, l, mid)
    if qr > mid:
        range_add(ql, qr, a, u << 1 | 1, mid + 1, r)
    tr[u] = (tr[u << 1] + tr[u << 1 | 1]) % mod

def range_sum(ql, qr, u, l, r):
    if ql <= l and r <= qr:
        return tr[u]
    pushdown(u, l, r)
    mid = (l + r) >> 1
    answer = 0
    if ql <= mid:
        answer += range_sum(ql, qr, u << 1, l, mid)
    if qr > mid:
        answer += range_sum(ql, qr, u << 1 | 1, mid + 1, r)
    return answer % mod


def build(root):
    # 父亲在前，逆序时儿子的子树大小已经算好。
    order = [root]
    dep[root] = 1
    for u in order:
        for v in g[u]:
            if v == fa[u]:
                continue
            fa[v] = u
            dep[v] = dep[u] + 1
            order.append(v)
    for u in reversed(order):
        sz[u] = 1
        for v in g[u]:
            if v == fa[u]:
                continue
            sz[u] += sz[v]
            if sz[v] > sz[son[u]]:
                son[u] = v

    timer = 0
    stack = [root]
    top[root] = root
    while stack:
        u = stack.pop()
        timer += 1
        dfn[u] = timer
        rev[timer] = u
        base[timer] = a[u]
        # 后进先出：先压轻儿子，再压重儿子，保持 DFS 的子树连续性。
        for v in g[u]:
            if v == fa[u] or v == son[u]:
                continue
            top[v] = v
            stack.append(v)
        if son[u]:
            top[son[u]] = top[u]
            stack.append(son[u])
    seg_build(1, 1, n, base)


def lca(u, v):
    while top[u] != top[v]:
        if dep[top[u]] < dep[top[v]]:
            u, v = v, u
        u = fa[top[u]]
    return u if dep[u] < dep[v] else v


def path_add(u, v, delta):
    while top[u] != top[v]:
        # 处理链头更深的一边，再跨过链头上方的轻边。
        if dep[top[u]] < dep[top[v]]:
            u, v = v, u
        range_add(dfn[top[u]], dfn[u], delta, 1, 1, n)
        u = fa[top[u]]
    # 同一条链上：浅的是 LCA，区间就是 [dfn[u], dfn[v]]。
    if dep[u] > dep[v]:
        u, v = v, u
    range_add(dfn[u], dfn[v], delta, 1, 1, n)

def path_sum(u, v):
    answer = 0
    while top[u] != top[v]:
        if dep[top[u]] < dep[top[v]]:
            u, v = v, u
        answer += range_sum(dfn[top[u]], dfn[u], 1, 1, n)
        answer %= mod
        u = fa[top[u]]
    if dep[u] > dep[v]:
        u, v = v, u
    answer += range_sum(dfn[u], dfn[v], 1, 1, n)
    return answer % mod

def subtree_add(u, delta):
    range_add(dfn[u], dfn[u] + sz[u] - 1, delta, 1, 1, n)

def subtree_sum(u):
    return range_sum(dfn[u], dfn[u] + sz[u] - 1, 1, 1, n)
