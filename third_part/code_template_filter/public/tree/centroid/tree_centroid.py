# 树的重心：节点编号为 1..n，输入必须是连通无环的树，n >= 1。
# 使用显式栈，链形树也不依赖 Python 递归深度。
n = 0
best = 0
g = []
fa = []
sz = []
balance = []
ans = []


def init(node_count):
    global n, best, g, fa, sz, balance, ans
    n = node_count
    best = n
    g = [[] for _ in range(n + 1)]
    fa = [0] * (n + 1)
    sz = [0] * (n + 1)
    balance = [0] * (n + 1)
    ans = []


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def find_centroids(root=1):
    """返回全部重心（编号升序），更新 fa、sz、balance、best。"""
    global best, ans
    order = []
    stack = [root]
    fa[root] = 0
    while stack:
        u = stack.pop()
        order.append(u)
        for v in g[u]:
            if v == fa[u]:
                continue
            fa[v] = u
            stack.append(v)

    # 父亲先入 order，逆序时儿子先完成。
    best = n
    for u in reversed(order):
        sz[u] = 1
        balance[u] = 0
        for v in g[u]:
            if v == fa[u]:
                continue
            sz[u] += sz[v]
            balance[u] = max(balance[u], sz[v])
        # 父亲方向必须等 sz[u] 完整后再计算。
        balance[u] = max(balance[u], n - sz[u])
        best = min(best, balance[u])

    ans = [u for u in range(1, n + 1) if balance[u] == best]
    return ans
