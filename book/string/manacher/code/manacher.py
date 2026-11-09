# Manacher：线性时间求最长回文子串。
# build(s) 后 longest() 返回 (长度, l, r)，[l, r] 是原串上的 0-based 闭区间；
# 无回文（空串）时返回 (0, 0, -1)。C++ 用 int& 出参，Python 改为元组返回。
# 变换串为 & # c1 # c2 # ... # ^，两端哨兵互不相等，扩展时无需判边界。
# C++ 用定长数组 MAXN=110000，Python list 按 len(s) 动态分配，没有长度上限。

IntSeq = list[int]  # p：半径数组，p[i] 为变换串上以 i 为中心的扩展长度
Text = list[str]  # t：变换后的字符序列，首尾各有一个哨兵


class Manacher:
    """t / p / m 与 C++ 成员一一对应；m 是含哨兵的变换串长度。"""

    t: Text
    p: IntSeq
    m: int

    def __init__(self) -> None:
        self.t = []
        self.p = []
        self.m = 0

    def build(self, s: str) -> None:
        """构造变换串并计算半径数组；可对同一对象反复 build 换新串。"""
        # 交错插入 '#' 后，任意回文长度都是奇数，一个数组即可同时处理奇偶回文。
        t: Text = ["&", "#"]
        for ch in s:
            t.append(ch)
            t.append("#")
        t.append("^")
        self.t = t
        self.m = len(t)
        self.p = [0] * self.m

        center = 0  # 当前已知最靠右回文的中心
        right = 0  # 该回文的右边界（不含）
        for i in range(1, self.m - 1):  # 跳过两个哨兵
            mirror = 2 * center - i  # i 关于 center 的对称点
            if i < right:
                # 对称点的半径受右边界限制，取两者较小值作为初值。
                self.p[i] = min(right - i, self.p[mirror])
            else:
                self.p[i] = 1  # 至少包含 i 自身
            # 暴力扩展；因为哨兵互不相等，最右/最左一定停得住。
            while self.t[i + self.p[i]] == self.t[i - self.p[i]]:
                self.p[i] += 1
            if i + self.p[i] > right:
                center = i
                right = i + self.p[i]

    def longest(self) -> tuple[int, int, int]:
        """返回 (最长回文长度, l, r)；无解返回 (0, 0, -1)。"""
        best_len = 0
        best_center = 0
        for i in range(1, self.m - 1):
            if self.p[i] - 1 > best_len:  # p[i]-1 正是该中心的原串回文长度
                best_len = self.p[i] - 1
                best_center = i
        if best_len == 0:
            return 0, 0, -1
        # 把变换串位置映射回原串下标：中心左侧有 (p[i]-1) 个原字符，间隔是 '#'。
        l = (best_center - best_len) // 2
        r = l + best_len - 1
        return best_len, l, r


if __name__ == "__main__":
    import sys
    data = sys.stdin.read().split()
    if data:
        s = data[0]
        solver = Manacher()
        solver.build(s)
        length, left, right = solver.longest()
        print(length)
        if length:
            print(s[left:right + 1])
