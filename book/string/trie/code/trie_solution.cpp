#include <array>
#include <string>
#include <vector>

// 小写字母 a-z；0 号节点为根，孩子编号 0 表示不存在。
// 重复插入按次数统计。pass 统计前缀，end 统计完整字符串。
struct Trie {
    struct Node {
        std::array<int, 26> ch{};
        int pass = 0;
        int end = 0;
    };

    std::vector<Node> tree{1};

    void insert(const std::string &s) {
        int u = 0;
        ++tree[u].pass;
        for (char c : s) {
            int x = c - 'a';
            int v = tree[u].ch[x];
            if (v == 0) {
                v = static_cast<int>(tree.size());
                tree[u].ch[x] = v;
                tree.emplace_back();
            }
            u = v;
            ++tree[u].pass;
        }
        ++tree[u].end;
    }

    // 返回字符串对应节点；路径不存在时返回 -1。
    int find(const std::string &s) const {
        int u = 0;
        for (char c : s) {
            int v = tree[u].ch[c - 'a'];
            if (v == 0) return -1;
            u = v;
        }
        return u;
    }

    bool contains(const std::string &s) const {
        int u = find(s);
        return u != -1 && tree[u].end > 0;
    }

    int count_prefix(const std::string &prefix) const {
        int u = find(prefix);
        return u == -1 ? 0 : tree[u].pass;
    }
};

#include <iostream>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n, q;
    if (!(std::cin >> n >> q)) return 0;
    Trie trie;
    for (int i = 0; i < n; ++i) {
        std::string s;
        std::cin >> s;
        trie.insert(s);
    }
    while (q--) {
        int op;
        std::string s;
        std::cin >> op >> s;
        if (op == 1) {
            std::cout << (trie.contains(s) ? "Yes" : "No") << '\n';
        } else if (op == 2) {
            std::cout << trie.count_prefix(s) << '\n';
        }
    }
}
