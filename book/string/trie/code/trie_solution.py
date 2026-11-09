class Trie:
    """节点 0 为根；字典只保存实际存在的字符边。"""

    def __init__(self) -> None:
        self.ch: list[dict[str, int]] = [{}]
        self.pass_count: list[int] = [0]
        self.end: list[int] = [0]

    def insert(self, s: str) -> None:
        u = 0
        self.pass_count[u] += 1
        for c in s:
            v = self.ch[u].get(c)
            if v is None:
                v = len(self.ch)
                self.ch[u][c] = v
                self.ch.append({})
                self.pass_count.append(0)
                self.end.append(0)
            u = v
            self.pass_count[u] += 1
        self.end[u] += 1

    def find(self, s: str) -> int:
        """返回字符串对应节点；路径不存在时返回 -1。"""
        u = 0
        for c in s:
            v = self.ch[u].get(c)
            if v is None:
                return -1
            u = v
        return u

    def contains(self, s: str) -> bool:
        u = self.find(s)
        return u != -1 and self.end[u] > 0

    def count_prefix(self, prefix: str) -> int:
        u = self.find(prefix)
        return 0 if u == -1 else self.pass_count[u]


def main() -> None:
    import sys

    data = iter(sys.stdin.buffer.read().split())
    first = next(data, None)
    if first is None:
        return
    n, q = int(first), int(next(data))
    trie = Trie()
    for _ in range(n):
        trie.insert(next(data).decode())

    out: list[str] = []
    for _ in range(q):
        op = int(next(data))
        s = next(data).decode()
        if op == 1:
            out.append("Yes" if trie.contains(s) else "No")
        elif op == 2:
            out.append(str(trie.count_prefix(s)))
    if out:
        sys.stdout.write("\n".join(out) + "\n")


if __name__ == "__main__":
    main()
