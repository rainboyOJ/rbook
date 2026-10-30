#include <bits/stdc++.h>
using namespace std;

// 无向基环树找环：找出一棵树加一条边后形成的那个唯一环。
// 输出环上的点（按环的顺序）、每条环边以及环长。
// 约定：n 个点 n 条边的连通无向图（可以有重边，但环长至少为 2）。
const int maxn = 200000 + 5;

int n, m;

/*------------------------ 链式前向星 开始 ------------------------*/
struct Edge {
    int to;   // 边指向的点
    int w;    // 边权
    int next; // 下一条边的下标
};

Edge e[maxn * 2];
int head[maxn], ecnt;

void add_edge(int u, int v, int w) {
    e[ecnt] = {v, w, head[u]};
    head[u] = ecnt++;
}

// 无向边存两次，下标 i 与 i^1 互为反向边
void add_edge2(int u, int v, int w) {
    add_edge(u, v, w);
    add_edge(v, u, w);
}
/*------------------------ 链式前向星 结束 ------------------------*/

/*------------------------ 找环 代码 开始 ------------------------*/
int dfn[maxn], timer; // dfn[u]：DFS 时间戳，0 表示未访问
int par[maxn];        // par[u]：DFS 树上的父亲
int parw[maxn];       // parw[u]：边 (par[u], u) 的权值

int cyc_n;        // 环上的点数
int cyc_v[maxn];  // 环上的点，按环的顺序存放
int cyc_w[maxn];  // cyc_w[i]：cyc_v[i] 到 cyc_v[i+1]（末项回到 cyc_v[0]）的边权
long long cyc_sum; // 环上边权之和

// 找到回边 u -> v（v 是 u 的祖先）后，沿父亲指针把整条环拼出来。
void build_cycle(int u, int v, int back_w) {
    int tmp[maxn], cnt = 0;
    // 从 u 一路回溯到 v，得到 [u, ..., v]
    for (int x = u; x != v; x = par[x]) tmp[cnt++] = x;
    tmp[cnt++] = v;

    cyc_n = cnt;
    // 反转成 [v, ..., u]，这样相邻两点之间就是一条环边
    for (int i = 0; i < cnt; ++i) cyc_v[i] = tmp[cnt - 1 - i];

    cyc_sum = 0;
    for (int i = 0; i + 1 < cnt; ++i) {
        cyc_w[i] = parw[cyc_v[i + 1]]; // cyc_v[i] -> cyc_v[i+1] 就是儿子那条父亲边
        cyc_sum += cyc_w[i];
    }
    cyc_w[cnt - 1] = back_w; // 最后一条是那条回边 u -> v
    cyc_sum += back_w;
}

// 返回 true 表示已经找到环，可以提前停止。
// in_edge 是进入 u 的那条边的下标，用它跳过反向边，重边也不会误判。
bool dfs(int u, int in_edge) {
    dfn[u] = ++timer;
    for (int i = head[u]; ~i; i = e[i].next) {
        if (i == (in_edge ^ 1)) continue; // 不走刚来的那条边的反向
        int v = e[i].to;
        if (!dfn[v]) {
            par[v] = u;
            parw[v] = e[i].w;
            if (dfs(v, i)) return true;
        }
        else if (dfn[v] < dfn[u]) {
            // 无向图 DFS 中，非树边一定连向祖先。
            // 只从时间戳大的一侧处理一次，避免同一个环被算两遍。
            build_cycle(u, v, e[i].w);
            return true;
        }
    }
    return false;
}
/*------------------------ 找环 代码 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    fill(head, head + n + 1, -1);
    ecnt = 0;
    for (int i = 1; i <= m; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        add_edge2(u, v, w);
    }

    dfs(1, -1); // -1 ^ 1 == -2，不会等于任何合法边下标

    cout << cyc_n << '\n';
    for (int i = 0; i < cyc_n; ++i) {
        cout << cyc_v[i] << ' ' << cyc_v[(i + 1) % cyc_n] << ' ' << cyc_w[i] << '\n';
    }
    cout << cyc_sum << '\n';
    return 0;
}
