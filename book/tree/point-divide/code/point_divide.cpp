#include <bits/stdc++.h>
using namespace std;

// 点分治（重心分治）通用框架：数出树上距离不超过 K 的点对数量。
// 对应洛谷 P4178 Tree。
// 约定：输入是连通无环的带权树，边权非负，节点编号 1..n。
const int maxn = 200000 + 5;

int n, K;

struct Edge {
    int to; // 边指向的点
    int w;  // 边权
};

vector<Edge> g[maxn];

/*------------------------ 点分治 代码 开始 ------------------------*/
bool removed[maxn]; // removed[u]：u 已被选作分治中心而删掉
int sz[maxn];       // sz[u]：当前连通块内的子树大小（含自己）
int mx[maxn];       // mx[u]：删掉 u 后，当前连通块内最大块的大小
int root, total;    // 当前连通块的重心、当前连通块的总点数

int dis[maxn], cnt; // 收集到的"到分治中心的距离"

long long ans; // 点对数量，可能是 O(n^2) 级，用 long long

void init(int node_count) {
    n = node_count;
    for (int u = 1; u <= n; ++u) g[u].clear();
    fill(removed, removed + n + 1, false);
    ans = 0;
}

void add_edge(int u, int v, int w) {
    g[u].push_back({v, w});
    g[v].push_back({u, w});
}

// 返回 u 所在连通块（不含已删点）的点数，顺带把 sz 填好。
// 每次递归进子树前都要重新算，不能沿用上一次的 sz：
// 上一次的 sz 是相对另一个根算的，不是这个连通块的大小。
int getsz(int u, int father) {
    sz[u] = 1;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == father || removed[v]) continue;
        sz[u] += getsz(v, u);
    }
    return sz[u];
}

// 在 u 所在连通块里找重心。调用前必须已经用 getsz 填好 sz，
// 且 total 等于这个连通块的真实点数。
void getroot(int u, int father) {
    mx[u] = 0;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == father || removed[v]) continue;
        getroot(v, u);
        mx[u] = max(mx[u], sz[v]); // 儿子方向
    }
    mx[u] = max(mx[u], total - sz[u]); // 父亲方向，别忘了
    if (mx[u] < mx[root]) root = u;
}

// 收集 u 的子树内所有点到"分治中心"的距离，d 是 u 到中心的已有距离。
void getdis(int u, int father, int d) {
    dis[++cnt] = d;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == father || removed[v]) continue;
        getdis(v, u, d + e.w);
    }
}

// 数出 dis[1..cnt] 中"距离之和 <= K"的点对数。
// 双指针要求有序，所以先排序：这一步就是点分治常见的那只 log。
long long count_le() {
    sort(dis + 1, dis + cnt + 1);
    long long res = 0;
    int l = 1, r = cnt;
    while (l < r) {
        if (dis[l] + dis[r] <= K) {
            res += r - l; // l 与 (l, r] 中每个点都能配对
            ++l;
        }
        else {
            --r;
        }
    }
    return res;
}

// 统计跨过 u 的路径：先算整个连通块，再减掉每棵子树内部的部分。
void calc(int u) {
    // 1. 整个连通块的点到 u 的距离（含 u 自己，距离 0）
    cnt = 0;
    dis[++cnt] = 0;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (removed[v]) continue;
        getdis(v, u, e.w);
    }
    ans += count_le();

    // 2. 减掉同一棵子树内部被重复统计的点对：它们的路径不经过 u
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (removed[v]) continue;
        cnt = 0;
        getdis(v, u, e.w);
        ans -= count_le();
    }
}

void solve(int u) {
    removed[u] = true; // 删掉 u，连通块被切开
    calc(u);           // 处理"经过 u"的路径

    for (const Edge &e : g[u]) {
        int v = e.to;
        if (removed[v]) continue;
        total = getsz(v, u); // 子树 v 现在是独立连通块，大小要重算
        root = 0;
        mx[0] = total + 1; // 哨兵：保证第一次比较一定能更新 root
        getroot(v, u);
        solve(root); // 递归处理剩余连通块
    }
}

void divide() {
    total = getsz(1, 0);
    root = 0;
    mx[0] = total + 1;
    getroot(1, 0);
    solve(root);
}
/*------------------------ 点分治 代码 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    init(n);
    for (int i = 1; i < n; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        add_edge(u, v, w);
    }
    cin >> K;

    divide();

    cout << ans << '\n';
    return 0;
}
