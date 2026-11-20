import sys


def get_factors(n: int) -> list[int]:
    small = []
    large = []
    d = 1
    while d * d <= n:
        if n % d == 0:
            small.append(d)
            other = n // d
            if d != other:
                large.append(other)
        d += 1
    # 小约数递增，大约数递减；反转后拼接。
    small.extend(reversed(large))
    return small


def main():
    n = int(sys.stdin.buffer.readline())
    print(*get_factors(n))


if __name__ == '__main__':
    main()
