#include <bits/stdc++.h>
using namespace std;

// 倍增（爬树）法求 LCA：全局数组 + 自由函数，不含 main，可整段复制进题解。
//
// 用法：
//   1. add_edge(u, v);           // 加边，n-1 条边都要加完
//   2. build(n, root);           // 一次 DFS 算出 dep 与整张 up 表
//   3. lca(u, v) / kth_ancestor(u, k) / dist(u, v)
//
// 编号 1..n；根的父亲是哨兵 0，dep[0] = 0，up[0][*] 恒为 0，
// 任何越界的上跳都落在这个黑洞点里，不需要额外判空。
// 递归深度最坏是 n（链形树），n 很大时要开大栈（ulimit -s unlimited）。

const int maxn = 1e5 + 5;
const int MAXLOG = 17; // 必须满足 2^MAXLOG >= n；maxn = 1e5 时 17 够用

vector<int> g[maxn];
int dep[maxn];              // dep[u]：深度，根为 1
int up[maxn][MAXLOG + 1];   // up[u][j]：u 的 2^j 级祖先
int lg;                     // 实际用到的最大指数，由 n 算出

void add_edge(int u, int v) {
    g[u].push_back(v);
    g[v].push_back(u);
}

// 进入 u 时它的整行 up 就能拼出来：up[u][j] = up[ up[u][j-1] ][j-1]，
// 所以不需要先 DFS 一遍再单独跑一轮倍增 DP。
void dfs(int u, int fa) {
    dep[u] = dep[fa] + 1;
    up[u][0] = fa;
    for (int j = 1; j <= lg; ++j) up[u][j] = up[up[u][j - 1]][j - 1];
    for (int v : g[u]) {
        if (v == fa) continue;
        dfs(v, u);
    }
}

// 预处理入口：加完边之后调用一次。数组在 dfs 里逐点覆写，无需 memset。
void build(int n, int root) {
    lg = 0;
    while (lg < MAXLOG && (1 << (lg + 1)) <= n) ++lg; // lg = floor(log2(n))
    dfs(root, 0);
}

// u 向上跳 k 层；k 超过深度时返回 0
int kth_ancestor(int u, int k) {
    for (int j = 0; j <= lg && u; ++j)
        if (k >> j & 1) u = up[u][j];
    return u;
}

int lca(int u, int v) {
    if (dep[u] < dep[v]) swap(u, v);
    u = kth_ancestor(u, dep[u] - dep[v]); // 第一步：深的点先提到同一层
    if (u == v) return u;                 // 浅点本身就是答案
    for (int j = lg; j >= 0; --j)         // 第二步：从大步到小步一起上跳
        if (up[u][j] != up[v][j]) {
            u = up[u][j];
            v = up[v][j];
        }
    return up[u][0]; // 停在 LCA 的两个不同儿子上，再上一层就是答案
}

int dist(int u, int v) {
    int w = lca(u, v);
    return dep[u] + dep[v] - 2 * dep[w];
}

/*------------------------ 读入输出 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, root;
    cin >> n >> m >> root;

    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        add_edge(u, v);
    }

    build(n, root);

    while (m--) {
        int u, v;
        cin >> u >> v;
        cout << lca(u, v) << '\n';
    }

    return 0;
}
