#include <bits/stdc++.h>
using namespace std;

// 无向基环树找环：剥叶法。
// 核心只有一句话：反复删掉度数为 1 的点（叶子），
// 剥到最后剩下的点必然全都待在环上。
// 输出格式与 find_cycle.cpp（DFS 版）完全一致，方便逐行对照。
// 约定：n 个点 n 条边的连通无向图（可以有重边，但环长至少为 2）。
const int maxn = 200000 + 5;

int n, m;

/*------------------------ 存图 开始 ------------------------*/
struct Edge {
    int to; // 边指向的点
    int w;  // 边权
    int id; // 这条有向边的编号；成对存放时 id 与 id^1 互为反向边
};

vector<Edge> g[maxn];
int ecnt;

void add_edge(int u, int v, int w) {
    g[u].push_back({v, w, ecnt++});
    g[v].push_back({u, w, ecnt++});
}
/*------------------------ 存图 结束 ------------------------*/

/*------------------------ 剥叶法找环 开始 ------------------------*/
int deg[maxn];     // deg[u]：u 当前的度数，剥叶过程中会不断减小
bool on_cyc[maxn]; // on_cyc[u]：u 还没被剥掉，也就是最终留在环上

long long cyc_sum; // 环上边权之和
vector<int> cyc_v; // 环上的点，按环的顺序存放
vector<int> cyc_w; // cyc_w[i]：cyc_v[i] 到 cyc_v[i+1]（末项回到 cyc_v[0]）的边权

void find_cycle() {
    // 第一步：剥叶。度数变成 1 的点就是叶子，删掉它会让邻居的度数再减一。
    queue<int> q;
    for (int u = 1; u <= n; ++u) {
        on_cyc[u] = true;
        if (deg[u] == 1) q.push(u);
    }

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        on_cyc[u] = false; // u 不是环上的点
        for (const Edge &e : g[u]) {
            int v = e.to;
            if (!on_cyc[v]) continue;       // 这个邻居已经被剥掉了，不用管
            if (--deg[v] == 1) q.push(v);   // v 变成了新的叶子
        }
    }

    // 第二步：剩下的一定是环，沿环走一圈，记录顺序和每条环边的权值。
    int start = 0;
    for (int u = 1; u <= n; ++u) {
        if (on_cyc[u]) {
            start = u;
            break;
        }
    }

    cyc_sum = 0;
    int pre_id = -1; // 刚走过的那条边的编号；用 pre_id^1 跳过它的反向边
    int cur = start;
    do {
        cyc_v.push_back(cur);
        for (const Edge &e : g[cur]) {
            if (!on_cyc[e.to]) continue;              // 只走环上的点
            if (e.id == (pre_id ^ 1)) continue;       // 不走刚来的那条边，重边也不会走回头
            cyc_w.push_back(e.w);
            cyc_sum += e.w;
            pre_id = e.id;
            cur = e.to;
            break;
        }
    } while (cur != start);
}
/*------------------------ 剥叶法找环 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    for (int i = 1; i <= m; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        add_edge(u, v, w);
        ++deg[u];
        ++deg[v];
    }

    find_cycle();

    int cyc_n = (int)cyc_v.size();
    cout << cyc_n << '\n';
    for (int i = 0; i < cyc_n; ++i) {
        cout << cyc_v[i] << ' ' << cyc_v[(i + 1) % cyc_n] << ' ' << cyc_w[i] << '\n';
    }
    cout << cyc_sum << '\n';
    return 0;
}
