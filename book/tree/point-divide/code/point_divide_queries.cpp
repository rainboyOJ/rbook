#include <bits/stdc++.h>
using namespace std;

// 点分治：多次询问"是否存在距离恰好为 K 的点对"。对应洛谷 P3806。
// 与 point_divide.cpp 的区别只在一处：统计方式不同。
//   point_divide.cpp  先收集后排序，用容斥"整块减子树"，数点对个数；
//   本文件            边收集边标记，用一个带时间戳的桶，天然不需要容斥。
// 约定：连通无环带权树，边权非负，节点编号 1..n。
const int maxn = 100000 + 5;

int n, m;

struct Edge {
    int to; // 边指向的点
    int w;  // 边权
};

vector<Edge> g[maxn];

/*------------------------ 点分治（多询问） 代码 开始 ------------------------*/
bool removed[maxn];
int sz[maxn];
int mx[maxn];
int root, total;

int dis[maxn], cnt; // 当前子树内各点到分治中心的距离

vector<int> qs;   // m 个询问的 K
vector<char> ok;  // ok[i]：第 i 个询问是否已有答案
vector<int> used; // used[d] == stamp 表示"距离 d 已被占用"
int stamp;        // 时间戳，用来免掉 memset
int maxk;         // 询问里最大的 K，决定桶的大小

void init(int node_count) {
    n = node_count;
    for (int u = 1; u <= n; ++u) g[u].clear();
    fill(removed, removed + n + 1, false);
}

void add_edge(int u, int v, int w) {
    g[u].push_back({v, w});
    g[v].push_back({u, w});
}

int getsz(int u, int father) {
    sz[u] = 1;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == father || removed[v]) continue;
        sz[u] += getsz(v, u);
    }
    return sz[u];
}

void getroot(int u, int father) {
    mx[u] = 0;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == father || removed[v]) continue;
        getroot(v, u);
        mx[u] = max(mx[u], sz[v]);
    }
    mx[u] = max(mx[u], total - sz[u]);
    if (mx[u] < mx[root]) root = u;
}

// 把 u 的子树内所有点到分治中心的距离装进 dis。
void getdis(int u, int father, int d) {
    dis[++cnt] = d;
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == father || removed[v]) continue;
        getdis(v, u, d + e.w);
    }
}

// 处理"经过 u"的路径。关键顺序：先拿本子树去查桶，再把本子树写进桶。
// 如果反过来，同一子树内的两个点也会被配上，而它们的路径根本不经过 u。
void calc(int u) {
    ++stamp;
    used[0] = stamp; // u 自己：距离 0 已占用，于是"u 到某点"的路径也能被找到

    for (const Edge &e : g[u]) {
        int v = e.to;
        if (removed[v]) continue;

        cnt = 0;
        getdis(v, u, e.w);

        // 1. 查询：本子树的每个距离，去桶里找补数
        for (int i = 1; i <= cnt; ++i) {
            for (int j = 0; j < m; ++j) {
                if (ok[j]) continue;
                long long need = (long long)qs[j] - dis[i];
                if (need >= 0 && need <= maxk && used[need] == stamp) {
                    ok[j] = 1;
                }
            }
        }

        // 2. 标记：本子树正式加入桶，供后面的兄弟子树配对
        for (int i = 1; i <= cnt; ++i) {
            if (dis[i] <= maxk) used[dis[i]] = stamp;
        }
    }
}

void solve(int u) {
    removed[u] = true;
    calc(u);

    for (const Edge &e : g[u]) {
        int v = e.to;
        if (removed[v]) continue;
        total = getsz(v, u);
        root = 0;
        mx[0] = total + 1;
        getroot(v, u);
        solve(root);
    }
}

void divide() {
    total = getsz(1, 0);
    root = 0;
    mx[0] = total + 1;
    getroot(1, 0);
    solve(root);
}
/*------------------------ 点分治（多询问） 代码 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    init(n);
    for (int i = 1; i < n; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        add_edge(u, v, w);
    }

    qs.resize(m);
    maxk = 0;
    for (int i = 0; i < m; ++i) {
        cin >> qs[i];
        maxk = max(maxk, qs[i]);
    }

    used.assign(maxk + 1, 0); // 桶的下标是"距离"，只需覆盖到最大询问
    ok.assign(m, 0);
    stamp = 0;

    divide();

    for (int i = 0; i < m; ++i) {
        cout << (ok[i] ? "AYE" : "NAY") << '\n';
    }
    return 0;
}
