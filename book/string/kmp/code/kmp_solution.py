# KMP：读入 text pattern（空白分隔），输出所有匹配起点（1 下标，空格分隔），
# 无匹配输出 -1。pi[i] 为 P[0..i] 的最长 border 长度（0 下标实现，语义同 C++ 的 1 下标版）。
import sys


def build_prefix_function(pattern: str) -> list[int]:
    m = len(pattern)
    pi = [0] * m
    j = 0
    for i in range(1, m):
        while j > 0 and pattern[i] != pattern[j]:
            j = pi[j - 1]
        if pattern[i] == pattern[j]:
            j += 1
        pi[i] = j
    return pi


def kmp_match(text: str, pattern: str) -> list[int]:
    positions: list[int] = []
    n, m = len(text), len(pattern)
    if m == 0:
        return positions

    pi = build_prefix_function(pattern)
    j = 0
    for i in range(n):
        while j > 0 and text[i] != pattern[j]:
            j = pi[j - 1]
        if text[i] == pattern[j]:
            j += 1
        if j == m:
            positions.append(i - m + 2)  # i 是 0 下标末字符，起点换成 1 下标
            j = pi[j - 1]
    return positions


def main() -> None:
    data = sys.stdin.buffer.read().split()
    text = data[0].decode()
    pattern = data[1].decode()

    positions = kmp_match(text, pattern)
    if not positions:
        print(-1)
        return
    print(" ".join(map(str, positions)))


if __name__ == "__main__":
    main()
