# 树的重心（倍增跳表下降版）：把“沿重链一步步下走”压成 O(log n)。
# 节点编号 1..n，输入必须是连通无环的树，n >= 1。
# 全程用显式栈，链形树也不依赖 Python 递归深度。
n = 0
g = []
fa = []
sz = []
son = []
up = []      # up[k][u]：沿重链从 u 向下跳 2^k 步到达的点，跳出叶子为 0
root_node = 0
ans = []


def init(node_count):
    global n, g, fa, sz, son, up, ans
    n = node_count
    g = [[] for _ in range(n + 1)]
    fa = [0] * (n + 1)
    sz = [0] * (n + 1)
    son = [0] * (n + 1)
    up = []
    ans = []


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def build(start=1):
    """一遍显式栈求 fa / sz / son，再按层搭倍增跳表。"""
    global root_node, up
    root_node = start
    # 1) 迭代 DFS 求遍历序与父亲。
    order = []
    stack = [start]
    fa[start] = 0
    while stack:
        u = stack.pop()
        order.append(u)
        for v in g[u]:
            if v == fa[u]:
                continue
            fa[v] = u
            stack.append(v)

    # 2) 逆序汇总子树大小并选出重儿子（儿子先完成）。
    for u in reversed(order):
        sz[u] = 1
        son[u] = 0
        for v in g[u]:
            if v == fa[u]:
                continue
            sz[u] += sz[v]
            if sz[v] > sz[son[u]]:
                son[u] = v

    # 3) 按层搭跳表：up[k][u] = up[k-1][ up[k-1][u] ]。
    #    外层枚举 k，保证第 k 层用到第 k-1 层时已经算好。
    LOGN = max(1, n.bit_length())  # 2^LOGN > n
    up = [[0] * (n + 1) for _ in range(LOGN)]
    up[0] = son[:]                 # 第 0 层就是重儿子
    for k in range(1, LOGN):
        prev, cur = up[k - 1], up[k]
        for u in range(1, n + 1):
            cur[u] = prev[prev[u]]


def centroid_of_subtree(u):
    """以 u 为根、大小为 sz[u] 的连通块的全部重心（编号升序，至多两个）。"""
    global ans
    m = sz[u]                      # 当前连通块的总点数
    for k in range(len(up) - 1, -1, -1):
        v = up[k][u]
        if v and sz[v] * 2 >= m:   # 能跳就跳
            u = v
    ans = [u]                      # 子节点方向都不足一半，u 一定是重心
    if sz[u] * 2 == m:             # 恰好一半：父节点也是重心
        ans.append(fa[u])
    ans.sort()
    return ans


def centroid_all():
    """整棵树的重心，就是根这一侧连通块的答案。"""
    return centroid_of_subtree(root_node)


def main():
    import sys

    line = sys.stdin.buffer.readline()
    if not line:
        return
    init(int(line))
    for _ in range(n - 1):
        u, v = map(int, sys.stdin.buffer.readline().split())
        add_edge(u, v)
    build()
    res = centroid_all()
    print(len(res))
    print(*res)


if __name__ == "__main__":
    main()
