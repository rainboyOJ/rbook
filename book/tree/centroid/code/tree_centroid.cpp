#include <bits/stdc++.h>
using namespace std;

// 树的重心，HLD 风格：1 下标、全局数组，预处理与树链剖分的 dfs1 完全同形。
// 约定：输入是连通无环的树，n >= 1，节点编号为 1..n。
const int maxn = 100000 + 5;

int n;
vector<int> g[maxn];

/*------------------------ 树的重心 代码 开始 ------------------------*/
int fa[maxn];      // fa[u]：父亲，根的 fa 为 0
int sz[maxn];      // sz[u]：子树大小（含自己）
int son[maxn];     // son[u]：重儿子，叶子为 0
int balance[maxn]; // balance[u]：删除 u 后的最大连通块大小 B(u)
int best;          // 所有 B(u) 的最小值
int root;          // 当前 DFS 根，重链走法要从它出发
vector<int> ans;   // 全部重心，编号升序

void init(int node_count) {
    n = node_count;
    // fa / sz / son / balance 会被 dfs1 逐点覆写，只需清空旧图。
    for (int u = 1; u <= n; ++u) g[u].clear();
}

void add_edge(int u, int v) {
    g[u].push_back(v);
    g[v].push_back(u);
}

// 第一遍 DFS（与 hld 的 dfs1 同形）：往下填 fa，回溯时汇总 sz 并选出重儿子。
// 回到 u 时 sz[u]、son[u] 都已确定，而 n 一开始就知道，所以
// B(u) = max(儿子方向最大块, 父亲方向 n - sz[u]) 可以就地算完。
void dfs1(int u, int father) {
    fa[u] = father;
    sz[u] = 1;
    son[u] = 0;
    for (int v : g[u]) {
        if (v == father) continue;
        dfs1(v, u);
        sz[u] += sz[v];
        if (sz[v] > sz[son[u]]) son[u] = v; // sz[0] 恒为 0，叶子自然没有重儿子
    }
    balance[u] = max(sz[son[u]], n - sz[u]); // 重儿子就是最大的那个儿子
    best = min(best, balance[u]);
}

// 预处理入口：加完边之后调用一次，同时得到 balance[1..n]、best 和全部重心 ans。
// root 只影响父子关系，不影响答案。
void build(int start = 1) {
    root = start;
    best = n;
    dfs1(root, 0);
    ans.clear();
    for (int u = 1; u <= n; ++u) {
        if (balance[u] == best) ans.push_back(u);
    }
}

// 只求重心、不扫全树：重心一定落在 build 那个 root 出发的重链上。
// 重儿子子树 > n/2 时父亲方向 < n/2，重心只能更深；停下即为重心。
// 若重儿子子树恰为 n/2，它也是重心（第二个重心只能是它）。
// 依赖 build() 填好的 sz / son，也可以直接复用已有 HLD 的这两个数组。
vector<int> centroid_on_heavy_path() {
    int u = root;
    while (son[u] && sz[son[u]] * 2 > n) u = son[u];
    vector<int> res;
    res.push_back(u);
    if (son[u] && sz[son[u]] * 2 == n) res.push_back(son[u]);
    sort(res.begin(), res.end()); // 至多两个，保证编号升序
    return res;
}
/*------------------------ 树的重心 代码 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int node_count;
    if (!(cin >> node_count)) return 0;
    init(node_count);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        add_edge(u, v);
    }
    build();
    cout << ans.size() << '\n';
    for (int i = 0; i < (int)ans.size(); ++i) {
        if (i) cout << ' ';
        cout << ans[i];
    }
    cout << '\n';
    return 0;
}
