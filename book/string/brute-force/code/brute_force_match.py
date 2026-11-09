# 暴力字符串匹配：返回 pattern 在 text 中每次出现的起始下标（0-based）。
# 空模式直接返回空列表（与 C++ 版一致），不做"处处匹配"的特判。
# 复杂度 O(n * m)；Python 的 str 下标越界会抛异常，所以循环上界必须先算好。

Positions = list[int]  # 匹配起点列表，0-based 升序


def brute_force_match(text: str, pattern: str) -> Positions:
    """返回所有出现位置的升序列表；text 为空或 pattern 比 text 长时返回空列表。"""
    positions: Positions = []
    n = len(text)
    m = len(pattern)

    if m == 0:
        return positions

    # range(n - m + 1) 等价于 C++ 的 start + m <= n，保证 start + matched 不越界。
    for start in range(n - m + 1):
        matched = 0
        while matched < m and text[start + matched] == pattern[matched]:
            matched += 1
        if matched == m:
            positions.append(start)

    return positions


if __name__ == "__main__":
    import sys
    data = sys.stdin.read().split()
    if len(data) >= 2:
        result = brute_force_match(data[0], data[1])
        print(" ".join(map(str, result)) if result else -1)
