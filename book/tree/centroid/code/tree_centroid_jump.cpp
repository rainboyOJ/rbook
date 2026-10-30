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

// 第一遍用的显式队列。倍增模板面向大 n，这里不用递归 dfs1，
// 避免链形树把调用栈压到 n 层（Python 版同理）。
int que[maxn];

void init(int node_count) {
    n = node_count;
    // fa / sz / son / up 会被 build 逐点覆写，只需清空旧图。
    for (int u = 1; u <= n; ++u) g[u].clear();
}

void add_edge(int u, int v) {
    g[u].push_back(v);
    g[v].push_back(u);
}

// 第二遍：按层搭跳表。up[u][k] = up[ up[u][k-1] ][k-1]。
// 必须外层枚举 k：第 k 层只依赖第 k-1 层，这样才能保证被跳到的点已经算好。
void build_jump() {
    for (int u = 1; u <= n; ++u) up[u][0] = son[u]; // 第 0 层就是重儿子
    for (int k = 1; k < LOGN; ++k)
        for (int u = 1; u <= n; ++u)
            up[u][k] = up[up[u][k - 1]][k - 1];
}

// 预处理入口：加完边之后调用一次。root 只决定父子关系，不影响重心集合。
// 第一步 BFS 填 fa 并记下遍历序，第二步逆序汇总 sz 并选出重儿子，
// 第三步按层搭跳表。三步都只处理线性数量的点。
void build(int start = 1) {
    root_node = start;
    int head = 0, tail = 0;
    fa[start] = 0;
    que[tail++] = start;
    while (head < tail) {
        int u = que[head++];
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            fa[v] = u;
            que[tail++] = v;
        }
    }
    for (int i = 1; i <= n; ++i) sz[i] = 1, son[i] = 0;
    for (int i = n - 1; i >= 1; --i) { // 跳过根，逆序保证儿子先汇总完
        int u = que[i]; // BFS 序的逆序 = 儿子先于父亲
        int p = fa[u];
        sz[p] += sz[u];
        if (sz[u] > sz[son[p]]) son[p] = u; // sz[0] 恒为 0，叶子自然没有重儿子
    }
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
