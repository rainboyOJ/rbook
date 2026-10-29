# 树链剖分（HLD）+ 懒标记线段树（1-indexed）

# ------------------------ sgt 代码 开始 ------------------------
# 懒标记线段树：维护数组 base[1..n]，支持区间加、区间和对 mod 取模。
base = []
tr = []
lazy = []
mod = 0


def sgt_init(size, modulus):
    global mod, base, tr, lazy
    mod = modulus
    base = [0] * (size + 1)
    tr = [0] * (4 * size + 5)
    lazy = [0] * (4 * size + 5)


def ls(p):
    """p 的左儿子 2p。"""
    return p << 1


def rs(p):
    """p 的右儿子 2p+1。"""
    return p << 1 | 1


def apply(p, l, r, value):
    # Python 的 % 结果非负，负数也能直接归一到 [0, mod)，所以不需要 norm。
    value %= mod
    tr[p] = (tr[p] + value * (r - l + 1)) % mod
    lazy[p] = (lazy[p] + value) % mod


def pushdown(p, l, r):
    # 懒标记为 0 无事可做；叶子没有儿子可下放，必须提前返回，
    # 否则 mid == l，会递归进入自己并且写越界的 tr[2 * p]。
    if not lazy[p] or l == r:
        return
    mid = (l + r) >> 1
    apply(ls(p), l, mid, lazy[p])
    apply(rs(p), mid + 1, r, lazy[p])
    lazy[p] = 0


def seg_build(p, l, r):
    lazy[p] = 0
    if l == r:
        tr[p] = base[l] % mod
        return
    mid = (l + r) >> 1
    seg_build(ls(p), l, mid)
    seg_build(rs(p), mid + 1, r)
    tr[p] = (tr[ls(p)] + tr[rs(p)]) % mod


def range_add(ql, qr, value, p, l, r):
    if ql <= l and r <= qr:
        apply(p, l, r, value)
        return
    pushdown(p, l, r)
    mid = (l + r) >> 1
    if ql <= mid:
        range_add(ql, qr, value, ls(p), l, mid)
    if qr > mid:
        range_add(ql, qr, value, rs(p), mid + 1, r)
    tr[p] = (tr[ls(p)] + tr[rs(p)]) % mod


def range_sum(ql, qr, p, l, r):
    if ql <= l and r <= qr:
        return tr[p]
    pushdown(p, l, r)
    mid = (l + r) >> 1
    answer = 0
    if ql <= mid:
        answer += range_sum(ql, qr, ls(p), l, mid)
    if qr > mid:
        answer += range_sum(ql, qr, rs(p), mid + 1, r)
    # 只累加 [0, mod) 的值，answer 一定非负。
    return answer % mod
# ------------------------ sgt 代码 结束 ------------------------


# ------------------------ hld 代码 开始 ------------------------
# 树链剖分：g 存树，a 存原点权，6 个核心数组维护树上信息。
n = 0
g = []
a = []

fa = []
dep = []
sz = []
son = []
top = []
dfn = []
timer = 0


def init(count, modulus):
    """一组新数据：清空邻接表、重建各数组，并把 mod / base 交给 sgt 段。"""
    global n, g, a, fa, dep, sz, son, top, dfn, timer
    n = count
    timer = 0
    # dfs1 / dfs2 是递归，链形树深度可达 n；这里按 n 放宽递归上限。
    import sys
    if sys.getrecursionlimit() < 3 * count + 100:
        sys.setrecursionlimit(3 * count + 100)
    sgt_init(count, modulus)
    g = [[] for _ in range(n + 1)]
    a = [0] * (n + 1)
    fa = [0] * (n + 1)
    dep = [0] * (n + 1)
    sz = [0] * (n + 1)
    son = [0] * (n + 1)
    top = [0] * (n + 1)
    dfn = [0] * (n + 1)


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def dfs1(u, father):
    fa[u] = father
    dep[u] = dep[father] + 1  # 根的 father 为 0、dep[0] 恒为 0，故根深度为 1
    sz[u] = 1                 # 先算上自己
    son[u] = 0                # 叶子没有重儿子
    for v in g[u]:
        if v == father:
            continue
        dfs1(v, u)
        sz[u] += sz[v]
        if sz[v] > sz[son[u]]:
            son[u] = v


def dfs2(u, head):
    global timer
    top[u] = head
    timer += 1
    dfn[u] = timer
    base[timer] = a[u]  # 把点权搬到 sgt 段的数组上，线段树维护的就是它
    if son[u]:
        dfs2(son[u], head)
    for v in g[u]:
        if v == fa[u] or v == son[u]:
            continue
        dfs2(v, v)


def build(root):
    """预处理入口：两遍 DFS 把树拍成 dfn 序，再建线段树。"""
    global timer
    dfs1(root, 0)        # 填 fa / dep / sz / son
    timer = 0
    dfs2(root, root)     # 填 top / dfn / base
    seg_build(1, 1, n)   # 交给 sgt 段


def lca(u, v):
    while top[u] != top[v]:
        if dep[top[u]] < dep[top[v]]:
            u, v = v, u
        u = fa[top[u]]
    return u if dep[u] < dep[v] else v


def path_add(u, v, delta):
    while top[u] != top[v]:
        if dep[top[u]] < dep[top[v]]:
            u, v = v, u
        range_add(dfn[top[u]], dfn[u], delta, 1, 1, n)
        u = fa[top[u]]
    if dep[u] > dep[v]:
        u, v = v, u
    range_add(dfn[u], dfn[v], delta, 1, 1, n)


def path_sum(u, v):
    answer = 0
    while top[u] != top[v]:
        if dep[top[u]] < dep[top[v]]:
            u, v = v, u
        answer = (answer + range_sum(dfn[top[u]], dfn[u], 1, 1, n)) % mod
        u = fa[top[u]]
    if dep[u] > dep[v]:
        u, v = v, u
    answer = (answer + range_sum(dfn[u], dfn[v], 1, 1, n)) % mod
    return answer


def subtree_add(u, delta):
    range_add(dfn[u], dfn[u] + sz[u] - 1, delta, 1, 1, n)


def subtree_sum(u):
    return range_sum(dfn[u], dfn[u] + sz[u] - 1, 1, 1, n)
# ------------------------ hld 代码 结束 ------------------------
