# 函数: 读取一行两个数字
read_2int = lambda : map(int,input().split())

def knapsack(n, m, items):
    """
    解决01背包问题
    :param n: 物品数量
    :param m: 背包容量
    :param items: 物品列表，每个物品是一个 (重量, 价值) 对
    :return: 最大价值
    """
    # 用一维dp数组来存储最大价值
    f = [0] * (m + 1)

    # 遍历每个物品
    for w, v in items:
        # 倒序遍历背包容量，以避免覆盖上一层状态
        for j in range(m, w - 1, -1):
            f[j] = max(f[j], f[j - w] + v)

    return f[m]

if __name__ == "__main__":
    # 读取数据
    n, m = read_2int()
    items = [read_2int() for _ in range(n)]
    ans = knapsack(n, m, items)
    print(ans)
