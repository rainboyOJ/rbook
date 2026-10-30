# 树的重心：节点编号为 1..n，输入必须是连通无环的树，n >= 1。
# 预处理与 C++ 版同形：递归 dfs1 一次求出 sz、son、balance。
# 链形树会递归 n 层，Python 3.12+ 的递归帧在堆上，放宽上限即可。
import sys

n = 0
best = 0
g = []
fa = []
sz = []
son = []
balance = []
ans = []


def init(node_count):
    global n, best, g, fa, sz, son, balance, ans
    n = node_count
    # 链形树上 dfs1 会递归 n 层，先把递归上限放开。
    sys.setrecursionlimit(max(3_000_000, node_count * 4))
    best = n
    g = [[] for _ in range(n + 1)]
    fa = [0] * (n + 1)
    sz = [0] * (n + 1)
    son = [0] * (n + 1)
    balance = [0] * (n + 1)
    ans = []


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def dfs1(u, father):
    """往下填 fa，回溯时汇总 sz、选出重儿子，并就地算出 B(u)。"""
    global best
    fa[u] = father
    sz[u] = 1
    son[u] = 0
    for v in g[u]:
        if v == father:
            continue
        dfs1(v, u)
        sz[u] += sz[v]
        if sz[v] > sz[son[u]]:   # sz[0] 恒为 0，叶子自然没有重儿子
            son[u] = v
    # 重儿子就是最大的那个儿子，父亲方向必须等 sz[u] 完整后再算。
    balance[u] = max(sz[son[u]], n - sz[u])
    best = min(best, balance[u])


def find_centroids(root=1):
    """返回全部重心（编号升序），更新 fa、sz、son、balance、best。"""
    global best, ans
    best = n
    dfs1(root, 0)
    ans = [u for u in range(1, n + 1) if balance[u] == best]
    return ans


def centroid_on_heavy_path():
    """沿重链求重心（至多两个，编号升序），需在同一次 find_centroids 之后调用。"""
    u = 1
    while son[u] and sz[son[u]] * 2 > n:
        u = son[u]
    res = [u]
    if son[u] and sz[son[u]] * 2 == n:
        res.append(son[u])
    res.sort()
    return res
