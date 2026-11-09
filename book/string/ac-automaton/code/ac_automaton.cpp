// AC 自动机（Aho-Corasick）模板：多模式串匹配，字符集为小写字母 'a'..'z'
// 用法：所有模式串 insert 完后调用 build()，再用 query() 走文本，最后 count_each() 取结果。
// build 同时补全字典图转移：失配不需要显式跳 fail，文本每个字符 O(1) 转移。
// 模式串要求非空；build() 只能调用一次，此后不能再 insert()。
// query() 每次清空旧计数；count_each() 不修改原始计数，可重复调用。
struct AC {
  struct Node {
    int ch[26] = {}; // build 前为 Trie 孩子；build 后为完整转移，0 表示根
    int fail = 0;   // 当前串的最长真后缀中，属于某个模式串前缀的状态
    int end = 0;    // 以该节点结尾的模式串编号数，不是文本中的出现次数
  };
  const char OFFSET = 'a';
  vector<Node> tr;
  vector<int> pat_node; // 每个模式串结尾的节点编号（按 insert 顺序）
  vector<int> order;    // build 的 BFS 序：深度递增，倒序遍历时子先于父
  vector<long long> cnt; // query() 之后每个状态作为最长匹配后缀的次数

  AC() { tr.push_back(Node()); }

  // 插入一个模式串 s
  void insert(const string &s) {
    int u = 0;
    for (char cc : s) {
      int c = cc - OFFSET;
      if (tr[u].ch[c] == 0) {
        tr[u].ch[c] = (int)tr.size();
        tr.push_back(Node());
      }
      u = tr[u].ch[c];
    }
    tr[u].end++;
    pat_node.push_back(u);
  }

  // BFS 构建 fail 指针；顺带把缺失转移补全（字典图）
  void build() {
    queue<int> q;
    order.clear();
    order.push_back(0); // 根深度为 0
    for (int c = 0; c < 26; c++) {
      if (tr[0].ch[c] != 0) {
        tr[tr[0].ch[c]].fail = 0; // 根的孩子失配只能回根
        q.push(tr[0].ch[c]);
      } else {
        tr[0].ch[c] = 0; // 根的缺失转移指向根自己
      }
    }
    while (!q.empty()) {
      int u = q.front();
      q.pop();
      order.push_back(u); // 所有非根节点出队时记录，包括根的孩子
      for (int c = 0; c < 26; c++) {
        int v = tr[u].ch[c];
        if (v != 0) {
          // u 接字符 c 到 v；fail(u) 接同一字符的落点就是候选后缀状态
          tr[v].fail = tr[tr[u].fail].ch[c];
          q.push(v);
        } else {
          // 缺失转移直接复用 fail 的转移，之后匹配无需再跳 fail
          tr[u].ch[c] = tr[tr[u].fail].ch[c];
        }
      }
    }
  }

  // 走一遍文本 s，记录每个节点被经过的次数
  void query(const string &s) {
    cnt.assign(tr.size(), 0);
    int u = 0;
    for (char cc : s) {
      int c = cc - OFFSET;
      u = tr[u].ch[c]; // build 之后转移总有定义
      cnt[u]++;
    }
  }

  // 需要先 query()：返回每个模式串在文本中的出现次数（按 insert 顺序）
  // 原理：节点 u 被经过 cnt[u] 次，则 fail 树上 u 的每个祖先都命中 cnt[u] 次；
  // 按 BFS 序倒序把 cnt 上传到 fail，等价于一次性做完所有 fail 链累加，总代价 O(节点数)。
  vector<long long> count_each() const {
    vector<long long> sum = cnt; // 在副本上传，避免重复调用时重复累加
    for (int i = (int)order.size() - 1; i >= 1; i--) {
      int u = order[i];
      sum[tr[u].fail] += sum[u];
    }
    vector<long long> ans;
    ans.reserve(pat_node.size());
    for (int u : pat_node) ans.push_back(sum[u]);
    return ans;
  }
};
