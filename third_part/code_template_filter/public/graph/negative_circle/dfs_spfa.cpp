// DFS 版 SPFA 判定负环
#include <iostream>
#include <vector>

using namespace std;

const long long INF = (1LL << 60);

struct Edge {
    int to;
    long long w;
};

const int maxn = 100000 + 5;
vector<Edge> g[maxn];
long long dis[maxn];
bool in_stack[maxn]; // 记录当前搜索递归栈上的点

void init_graph(int n) {
    for (int i = 1; i <= n; ++i) g[i].clear();
}

void add_edge(int u, int v, long long w) {
    g[u].push_back({v, w});
}

// 递归函数：若在当前松弛链上再次访问到已经在递归栈中的点，则证明存在负环
bool dfs_spfa(int u) {
    in_stack[u] = true;

    for (const auto& e : g[u]) {
        int v = e.to;
        if (dis[u] + e.w < dis[v]) {
            dis[v] = dis[u] + e.w;
            // 若被松弛的目标点 v 已经在当前 DFS 递归调用链（调用栈）中，
            // 说明绕了一圈回来还能让距离变得更小，必然存在负环！
            if (in_stack[v] || dfs_spfa(v)) {
                return true;
            }
        }
    }

    in_stack[u] = false; // 回溯出栈
    return false;
}

// 检测全图是否存在负环
bool has_negative_cycle_dfs(int n) {
    fill(dis + 1, dis + n + 1, 0);
    fill(in_stack + 1, in_stack + n + 1, false);

    for (int i = 1; i <= n; ++i) {
        if (dfs_spfa(i)) return true;
    }
    return false;
}
