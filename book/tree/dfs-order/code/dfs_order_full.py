# 完整实现（Python 版）：与 C++ 版输出完全一致。
# 输入：n；n-1 行边；q；q 行祖孙询问（问 u 是不是 v 的祖先）。
# 输出：先序、欧拉序、每个点的 in/out/size/dep，以及每次询问的 yes/no。
# 深树（链）递归会爆栈，先序遍历统一用显式栈迭代。
import sys


def main() -> None:
    data = sys.stdin.buffer.read().split()
    if not data:
        return
    pos = 0
    n = int(data[pos])
    pos += 1

    tree: list[list[int]] = [[] for _ in range(n + 1)]
    for _ in range(n - 1):
        u = int(data[pos])
        v = int(data[pos + 1])
        pos += 2
        tree[u].append(v)
        tree[v].append(u)

    in_ = [0] * (n + 1)
    out = [0] * (n + 1)
    sz = [0] * (n + 1)
    dep = [0] * (n + 1)
    order = [0] * (n + 1)

    # ---------- 先序：进入记 in，退出记 out ----------
    dep[1] = 1
    timer = 0
    # 栈元素 (点, 父亲, 下一条待处理的邻边下标)，下标 0 兼作“还没进入”的标记
    stack: list[tuple[int, int, int]] = [(1, 0, 0)]
    while stack:
        u, fa, idx = stack.pop()
        if idx == 0:  # 第一次弹到 u
            timer += 1
            in_[u] = timer
            order[timer] = u
            sz[u] = 1
        advanced = False
        while idx < len(tree[u]):
            v = tree[u][idx]
            idx += 1
            if v == fa:
                continue
            dep[v] = dep[u] + 1
            stack.append((u, fa, idx))
            stack.append((v, u, 0))
            advanced = True
            break
        if not advanced:  # 邻边走完
            out[u] = timer
            if stack:
                sz[stack[-1][0]] += sz[u]

    # ---------- 欧拉序：进入写一次，每从一个儿子返回再写一次 ----------
    euler: list[int] = []

    def dfs_euler(u: int, fa: int) -> None:
        euler.append(u)
        for v in tree[u]:
            if v == fa:
                continue
            dfs_euler(v, u)
            euler.append(u)

    sys.setrecursionlimit(max(1000, n * 2 + 10))  # 欧拉序这里仍是递归，深度是 n
    dfs_euler(1, 0)

    print("order:", *order[1:])
    print("euler:", *euler)
    for u in range(1, n + 1):
        print(f"{u}: in={in_[u]} out={out[u]} size={sz[u]} dep={dep[u]}")

    q = int(data[pos])
    pos += 1
    ans: list[str] = []
    for _ in range(q):
        u = int(data[pos])
        v = int(data[pos + 1])
        pos += 2
        ok = in_[u] <= in_[v] <= out[u]
        ans.append(f"{u} {v} {'yes' if ok else 'no'}")
    if ans:
        sys.stdout.write("\n".join(ans) + "\n")


if __name__ == "__main__":
    main()
