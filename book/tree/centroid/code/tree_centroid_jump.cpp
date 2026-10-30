#include <bits/stdc++.h>
using namespace std;

// 树的重心（倍增跳表下降版）：把“沿重链一步步下走”压成 O(log n)。
// 约定：输入是连通无环的树，n >= 1，节点编号为 1..n。
// maxn / LOGN 按 n 的上限调整：必须保证 2^LOGN > n。
const int maxn = 300000 + 5;
const int LOGN = 20; // 2^19 = 524288 > 3e5

int n;
vector<int> g[maxn];

/*------------------------ 倍增跳表下降求重心 代码 开始 ------------------------*/
int fa[maxn];       // fa[u]：父亲，根的 fa 为 0
int sz[maxn];       // sz[u]：子树大小（含自己）
int son[maxn];      // son[u]：重儿子，叶子为 0
int up[maxn][LOGN]; // up[u][k]：沿重链从 u 向下跳 2^k 步到达的点，跳出叶子为 0
int root_node;      // build 的根，重链从这里出发
vector<int> ans;    // 重心结果，编号升序

void init(int node_count) {
    n = node_count;
    // fa / sz / son / up 会被 dfs1 与 build_jump 逐点覆写，只需清空旧图。
    for (int u = 1; u <= n; ++u) g[u].clear();
}

void add_edge(int u, int v) {
    g[u].push_back(v);
    g[v].push_back(u);
}

// 第一遍 DFS：与 hld 的 dfs1 同形，往下填 fa，回溯时汇总 sz 并选出重儿子。
// 回到 u 时 sz[u]、son[u] 都已确定，重链的第 0 层 up[u][0] 也就定了。
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
    up[u][0] = son[u];
}

// 第二遍：按层搭跳表。up[u][k] = up[ up[u][k-1] ][k-1]。
// 必须外层枚举 k：第 k 层只依赖第 k-1 层，这样才能保证被跳到的点已经算好。
void build_jump() {
    for (int k = 1; k < LOGN; ++k)
        for (int u = 1; u <= n; ++u)
            up[u][k] = up[up[u][k - 1]][k - 1];
}

// 预处理入口：加完边之后调用一次。root 只决定父子关系，不影响重心集合。
void build(int start = 1) {
    root_node = start;
    dfs1(root_node, 0);
    build_jump();
}

// 求“以 u 为根、大小为 sz[u] 的连通块”的全部重心（编号升序，至多两个）。
// 沿重链向下走：只要某个方向的点还不少于连通块的一半，重心必在那一侧。
// 重链上 sz 严格递减，所以“2*sz[x] >= m”沿链单调，可用跳表大步到小步贪心下降。
vector<int> centroid_of_subtree(int u) {
    int m = sz[u]; // 当前连通块的总点数
    for (int k = LOGN - 1; k >= 0; --k) {
        int v = up[u][k];
        if (v != 0 && sz[v] * 2 >= m) u = v; // 能跳就跳
    }
    ans.clear();
    ans.push_back(u); // u 的子节点方向都不足一半，它一定是重心
    if (sz[u] * 2 == m) ans.push_back(fa[u]); // 恰好一半：父节点也是重心
    sort(ans.begin(), ans.end()); // 至多两个，保证编号升序
    return ans;
}

// 整棵树的重心，就是根这一侧连通块的答案。
vector<int> centroid_all() {
    return centroid_of_subtree(root_node);
}
/*------------------------ 倍增跳表下降求重心 代码 结束 ------------------------*/

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
    vector<int> res = centroid_all();
    cout << res.size() << '\n';
    for (int i = 0; i < (int)res.size(); ++i) {
        if (i) cout << ' ';
        cout << res[i];
    }
    cout << '\n';
    return 0;
}
