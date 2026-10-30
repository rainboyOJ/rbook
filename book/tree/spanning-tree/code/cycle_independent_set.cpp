#include <bits/stdc++.h>
using namespace std;

// 基环树最大权独立集：断环 + 树形 DP。对应洛谷 P1453 城市环路。
//
// 思路：环上任意一条边 (a,b) 断开后，图就成了一棵树，可以直接做「没有上司的舞会」。
// 但断掉的那条边原本禁止 a、b 同时被选，所以分两次 DP 把这个约束补回来：
//   第一次以 a 为根，取 a 不选的答案 f[a][0]  (a 不选，则 (a,b) 自然满足)
//   第二次以 b 为根，取 b 不选的答案 f[b][0]  (b 不选，同上)
// 任何一个合法方案必然有「a 不选」或「b 不选」，所以两者取 max 就是答案。
//
// 约定：n 个点 n 条边的连通无向图（单圈图），点编号 0..n-1。
const int maxn = 100000 + 5;

int n;
long long p[maxn]; // p[u]：u 的点权（人流量）

/*------------------------ 存图 开始 ------------------------*/
struct Edge {
    int to; // 边指向的点
    int id; // 这条有向边的编号；成对存放时 id 与 id^1 互为反向边
};

vector<Edge> g[maxn];
int ecnt;

void add_edge(int u, int v) {
    g[u].push_back({v, ecnt++});
    g[v].push_back({u, ecnt++});
}
/*------------------------ 存图 结束 ------------------------*/

/*------------------------ 断环 + 树形DP 开始 ------------------------*/
int deg[maxn];     // deg[u]：u 当前的度数，剥叶过程中会减小
bool on_cyc[maxn]; // on_cyc[u]：u 还没被剥掉，也就是最终留在环上

int cut_id; // 被断开的环边编号
int cut_a;  // 被断边的两个端点
int cut_b;

// 第一步：剥叶找环，然后随便挑一条「两端都在环上」的边作为要断的边。
// 注意必须记录边而不是只记录两个端点：二元环（两点之间两条边）时，
// 只按端点删会把两条边一起删掉。
void find_cut_edge() {
    queue<int> q;
    for (int u = 1; u <= n; ++u) {
        on_cyc[u] = true;
        if (deg[u] == 1) q.push(u);
    }
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        on_cyc[u] = false;
        for (const Edge &e : g[u]) {
            if (!on_cyc[e.to]) continue;
            if (--deg[e.to] == 1) q.push(e.to);
        }
    }

    cut_id = -1;
    for (int u = 1; u <= n && cut_id < 0; ++u) {
        if (!on_cyc[u]) continue;
        for (const Edge &e : g[u]) {
            if (!on_cyc[e.to]) continue;
            cut_id = e.id;
            cut_a = u;
            cut_b = e.to;
            break;
        }
    }
}

long long f[maxn][2]; // f[u][0]：u 不选；f[u][1]：u 选

// 第二步：在断边后的树上做最大权独立集。
// 跳过被断的那条边（正反两个编号都要跳）。
void dfs(int u, int fa) {
    f[u][0] = 0;
    f[u][1] = p[u];
    for (const Edge &e : g[u]) {
        int v = e.to;
        if (v == fa) continue;
        if (e.id == cut_id || e.id == (cut_id ^ 1)) continue; // 这条边已断
        dfs(v, u);
        f[u][0] += max(f[v][0], f[v][1]); // u 不选，儿子随意
        f[u][1] += f[v][0];               // u 选，儿子只能不选
    }
}

// 第三步：分别以两端为根各跑一遍，取「根不选」的较大值。
long long solve() {
    find_cut_edge();

    dfs(cut_a, 0);
    long long ans_a = f[cut_a][0];

    dfs(cut_b, 0);
    long long ans_b = f[cut_b][0];

    return max(ans_a, ans_b);
}
/*------------------------ 断环 + 树形DP 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    for (int i = 0; i < n; ++i) {
        cin >> p[i + 1]; // 题目编号 0..n-1，这里统一平移到 1..n
    }
    for (int i = 1; i <= n; ++i) {
        int u, v;
        cin >> u >> v;
        add_edge(u + 1, v + 1);
        ++deg[u + 1];
        ++deg[v + 1];
    }

    double k;
    cin >> k;

    long long best = solve();
    printf("%.1f\n", (double)best * k);
    return 0;
}
