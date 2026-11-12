import sys


def precompute_factors(n: int) -> list[list[int]]:
    # 为每个数创建独立列表，不能写成 [[]] * (n + 1)。
    factors = [[] for _ in range(n + 1)]
    for d in range(1, n + 1):
        for j in range(d, n + 1, d):
            factors[j].append(d)
    return factors


def main():
    # 按行读入并依次产生整数，避免一次保留所有查询和输出。
    data = (int(value) for line in sys.stdin.buffer for value in line.split())
    n = next(data)
    q = next(data)
    factors = precompute_factors(n)
    for _ in range(q):
        x = next(data)
        print(*factors[x])


if __name__ == '__main__':
    main()
