# KMP：build_prefix_function 返回 1-based 的 pi 数组（长度 m+1，pi[0] 占位不用）。
# kmp_match 返回 pattern 在 text 中所有出现位置的 1-based 起始下标
# （注意与 brute_force_match 的 0-based 约定不同）；空模式返回空列表。
# 预处理 O(m) + 匹配 O(n)，文本指针只前进不回溯。

Pi = list[int]  # 前缀函数，长度 m+1，pi[1..m] 有效，pi[0] 占位
Positions = list[int]  # 匹配起点列表，1-based


def build_prefix_function(pattern: str) -> Pi:
    """pi[i] = pattern[1..i] 的最长相等真前后缀长度；i 是 1-based 逻辑下标。"""
    m = len(pattern)
    pi = [0] * (m + 1)  # pi[1] = 0 天然成立，循环从 i = 2 开始
    j = 0  # 不变量：每轮开始时 j == pi[i - 1]
    for i in range(2, m + 1):
        # 失配就沿 pi 回退，直到能接上或退到 0；pattern[j] 是待比较的下一位。
        while j > 0 and pattern[i - 1] != pattern[j]:
            j = pi[j]
        if pattern[i - 1] == pattern[j]:
            j += 1
        pi[i] = j
    return pi


def kmp_match(text: str, pattern: str) -> Positions:
    """返回所有匹配起点（1-based）；同一位置可重叠，例如 text=aaa pattern=aa 返回 [1, 2]。"""
    positions: Positions = []
    n = len(text)
    m = len(pattern)

    if m == 0:
        return positions

    pi = build_prefix_function(pattern)
    j = 0  # 当前已匹配的 pattern 前缀长度
    for i in range(1, n + 1):
        while j > 0 and text[i - 1] != pattern[j]:
            j = pi[j]
        if text[i - 1] == pattern[j]:
            j += 1

        if j == m:
            positions.append(i - m + 1)  # 换算成 1-based 起点
            j = pi[j]  # 回退以保留重叠匹配，不能直接清零
    return positions
