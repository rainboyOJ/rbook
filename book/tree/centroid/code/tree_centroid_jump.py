# 树的重心（倍增跳表下降版）：把“沿重链一步步下走”压成 O(log n)。
# 节点编号 1..n，输入必须是连通无环的树，n >= 1。
# dfs1 是递归写法，与 C++ 版同形；Python 3.12+ 的递归帧分配在堆上，
# 只要放宽递归上限就能跑链形树，不需要手工维护显式栈。
import sys
from array import array

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
    # 链形树上 dfs1 会递归 n 层，先把上限放开（Python 3.12+ 的帧在堆上）。
    sys.setrecursionlimit(max(3_000_000, node_count * 4))
    g = [[] for _ in range(n + 1)]
    fa = [0] * (n + 1)
    sz = [0] * (n + 1)
    son = [0] * (n + 1)
    up = []
    ans = []


def add_edge(u, v):
    g[u].append(v)
    g[v].append(u)


def dfs1(u, father):
    """往下填 fa，回溯时汇总 sz、选出重儿子，并顺手定下跳表第 0 层。"""
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
    up[0][u] = son[u]


def build(start=1):
    """dfs1 求 fa / sz / son / up[0]，再按层搭跳表。root 不影响重心集合。"""
    global root_node, up
    root_node = start
    LOGN = max(1, n.bit_length())      # 2^LOGN > n
    # 用 array('i') 存跳表：每个格子 4 字节，n=3e5 时全表约 23MB，
    # 换成 list 会因为每个 int 是独立对象而涨到 150MB 以上。
    up = [array('i', bytes(4 * (n + 1))) for _ in range(LOGN)]
    dfs1(start, 0)

    # 按层搭跳表：up[k][u] = up[k-1][ up[k-1][u] ]。
    # 外层枚举 k，保证第 k 层用到第 k-1 层时已经算好。
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
