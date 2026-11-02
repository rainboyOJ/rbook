# 倍增（爬树）法求 LCA：全局数组 + 自由函数，不含 main，可整段复制进题解。
#
# 用法：
#   1. add_edge(u, v)          # 加边，n-1 条边都要加完
#   2. build(n, root)          # 一次 DFS 算出 dep 与整张 up 表
#   3. lca(u, v) / kth_ancestor(u, k) / dist(u, v)
#
# 编号 1..n；根的父亲是哨兵 0，dep[0] = 0，up[0][*] 恒为 0，
# 任何越界的上跳都落在这个黑洞点里，不需要额外判空。
# Python 的递归同样受深度限制，init() 里会按 n 放宽递归上限。

g = []
dep = []
up = []
lg = 0


def init(n):
    """一组新数据：重建邻接表与两张表，并按 n 放宽递归上限。"""
    global g, dep, up, lg
    import sys
    if sys.getrecursionlimit() < 3 * n + 100:
        sys.setrecursionlimit(3 * n + 100)
    lg = 0
    while (1 << (lg + 1)) <= n:
        lg += 1
    g = [[] for _ in range(n + 1)]
    dep = [0] * (n + 1)
    up = [[0] * (lg + 1) for _ in range(n + 1)]


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def dfs(u, fa):
    """进入 u 时它的整行 up 就能拼出来：up[u][j] = up[up[u][j-1]][j-1]。"""
    dep[u] = dep[fa] + 1
    up[u][0] = fa
    for j in range(1, lg + 1):
        up[u][j] = up[up[u][j - 1]][j - 1]
    for v in g[u]:
        if v == fa:
            continue
        dfs(v, u)


def build(n, root):
    """预处理入口：加完边之后调用一次。"""
    init(n)
    dfs(root, 0)


def kth_ancestor(u, k):
    """u 向上跳 k 层；k 超过深度时返回 0。"""
    j = 0
    while j <= lg and u:
        if k >> j & 1:
            u = up[u][j]
        j += 1
    return u


def lca(u, v):
    if dep[u] < dep[v]:
        u, v = v, u
    u = kth_ancestor(u, dep[u] - dep[v])  # 第一步：深的点先提到同一层
    if u == v:                            # 浅点本身就是答案
        return u
    for j in range(lg, -1, -1):           # 第二步：从大步到小步一起上跳
        if up[u][j] != up[v][j]:
            u = up[u][j]
            v = up[v][j]
    return up[u][0]  # 停在 LCA 的两个不同儿子上，再上一层就是答案


def dist(u, v):
    w = lca(u, v)
    return dep[u] + dep[v] - 2 * dep[w]


# ------------------------ 读入输出 ------------------------

def main():
    import sys
    read = sys.stdin.buffer.readline
    n, m, root = map(int, read().split())
    init(n)
    for _ in range(n - 1):
        u, v = map(int, read().split())
        add_edge(u, v)
    dfs(root, 0)

    out = []
    for _ in range(m):
        u, v = map(int, read().split())
        out.append(str(lca(u, v)))
    sys.stdout.write("\n".join(out))


if __name__ == "__main__":
    main()
