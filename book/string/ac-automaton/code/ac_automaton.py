# AC 自动机（Aho-Corasick）模板：多模式串匹配，字符集为小写字母 'a'..'z'
# 用法：所有模式串 insert 完后调用 build()，再用 query() 走文本，最后 count_each() 取结果。
# build 同时补全字典图转移：失配不需要显式跳 fail，文本每个字符 O(1) 转移。
# 模式串要求非空；build() 只能调用一次，此后不能再 insert()。
# query() 每次清空旧计数；count_each() 不修改原始计数，可重复调用。


class AC:
    def __init__(self):
        # ch[u][c] 字典图转移；fail[u] 失配指针；end[u] 以 u 结尾的模式串个数
        self.ch = [[0] * 26]
        self.fail = [0]
        self.end = [0]
        self.pat_node = []  # 每个模式串结尾的节点编号（按插入顺序）
        self.order = []     # build 的 BFS 序：深度递增，倒序遍历时子先于父
        self.cnt = []       # query() 之后每个状态作为最长匹配后缀的次数

    # 插入一个模式串 s
    def insert(self, s):
        u = 0
        for cc in s:
            c = ord(cc) - ord("a")
            if self.ch[u][c] == 0:
                self.ch[u][c] = len(self.ch)
                self.ch.append([0] * 26)
                self.fail.append(0)
                self.end.append(0)
            u = self.ch[u][c]
        self.end[u] += 1
        self.pat_node.append(u)

    # BFS 构建 fail 指针；顺带把缺失转移补全（字典图）
    def build(self):
        from collections import deque

        q = deque()
        self.order = [0]
        for c in range(26):
            if self.ch[0][c] != 0:
                self.fail[self.ch[0][c]] = 0  # 根的孩子失配只能回根
                q.append(self.ch[0][c])
            else:
                self.ch[0][c] = 0  # 根的缺失转移指向根自己
        while q:
            u = q.popleft()
            self.order.append(u)  # 包括根的孩子，保证每个节点恰好记录一次
            for c in range(26):
                v = self.ch[u][c]
                if v != 0:
                    # u 接字符 c 到 v；fail(u) 接同一字符的落点就是候选后缀状态
                    self.fail[v] = self.ch[self.fail[u]][c]
                    q.append(v)
                else:
                    # 缺失转移直接复用 fail 的转移，之后匹配无需再跳 fail
                    self.ch[u][c] = self.ch[self.fail[u]][c]

    # 走一遍文本 s，记录每个节点被经过的次数
    def query(self, s):
        self.cnt = [0] * len(self.ch)
        u = 0
        for cc in s:
            c = ord(cc) - ord("a")
            u = self.ch[u][c]  # build 之后转移总有定义
            self.cnt[u] += 1

    # 需要先 query()：返回每个模式串在文本中的出现次数（按插入顺序）
    # 原理：节点 u 被经过 cnt[u] 次，则 fail 树上 u 的每个祖先都命中 cnt[u] 次；
    # 按 BFS 序倒序把 cnt 上传到 fail，总代价 O(节点数)。
    def count_each(self):
        cnt = self.cnt[:]
        for i in range(len(self.order) - 1, 0, -1):
            u = self.order[i]
            cnt[self.fail[u]] += cnt[u]
        return [cnt[u] for u in self.pat_node]
