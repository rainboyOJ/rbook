# 最小表示法：返回字典序最小的循环同构串的起始下标（0 <= pos < n）。
# 双指针 i、j 加偏移 k 比较，失配时一次淘汰 k+1 个起点，均摊 O(n)。
# 空串返回 0（初始 i=0, j=1 取 min）；调用方自行拼出 s[pos:] + s[:pos]。


def minimal_rotation_pos(s: str) -> int:
    """返回最小循环同构串的起点下标。"""
    n = len(s)
    i = 0
    j = 1
    k = 0

    while i < n and j < n and k < n:
        # (i + k) % n：循环同构，越过末尾就绕回开头。
        a = s[(i + k) % n]
        b = s[(j + k) % n]

        if a == b:
            k += 1
        elif a > b:
            # s[i..i+k] 这一段字典序更大，i 到 i+k 都不可能是答案，整体跳过。
            i += k + 1
            if i == j:  # 两指针重合会让比较失去意义，错开一格
                i += 1
            k = 0
        else:
            j += k + 1
            if i == j:
                j += 1
            k = 0

    return min(i, j)


if __name__ == "__main__":
    import sys
    data = sys.stdin.read().split()
    if data:
        s = data[0]
        pos = minimal_rotation_pos(s)
        print(s[pos:] + s[:pos])
