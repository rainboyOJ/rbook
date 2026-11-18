#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
const int maxm = 2000000 + 5;

struct Edge {
    int to, id;
};

vector<Edge> g[maxn];
vector<int> block[maxn], tree[maxn];
int eu[maxm], ev[maxm];  // 每条原始无向边只记录一份端点
int dfn[maxn], low[maxn], belong[maxn], degree[maxn];
bool is_bridge[maxm];
int timer = 0, bcc_count = 0, connected_count = 0;

// 第一遍：只标记桥，按边号跳过进入当前点的边。
void dfs_bridge(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;
    for (auto [v, id] : g[u]) {
        if (id == in_edge) continue;
        if (!dfn[v]) {
            dfs_bridge(v, id);
            low[u] = min(low[u], low[v]);
            if (low[v] > dfn[u]) is_bridge[id] = true;
        } else if (dfn[v] < dfn[u]) {
            low[u] = min(low[u], dfn[v]);
        }
    }
}

// 第二遍：忽略所有桥，把能够到达的点标为同一分量。
void paint(int u, int color) {
    belong[u] = color;
    for (auto [v, id] : g[u]) {
        if (is_bridge[id] || belong[v]) continue;
        paint(v, color);
    }
}

void build_components(int n) {
    for (int u = 1; u <= n; ++u) {
        if (dfn[u]) continue;
        ++connected_count;
        dfs_bridge(u, -1);
    }
    for (int u = 1; u <= n; ++u) {
        if (!belong[u]) paint(u, ++bcc_count);
    }
    // 按原编号收集成员，使每个分量内的输出顺序固定。
    for (int u = 1; u <= n; ++u) block[belong[u]].push_back(u);
}

void build_forest(int m) {
    for (int id = 0; id < m; ++id) {
        if (!is_bridge[id]) continue;
        int a = belong[eu[id]], b = belong[ev[id]];
        tree[a].push_back(b);
        tree[b].push_back(a);
        ++degree[a];
        ++degree[b];
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int id = 0; id < m; ++id) {
        cin >> eu[id] >> ev[id];
        g[eu[id]].push_back({ev[id], id});
        g[ev[id]].push_back({eu[id], id});
    }
    build_components(n);
    build_forest(m);  // 保存桥树/森林，不额外输出，供后续应用使用

    cout << bcc_count << '\n';
    for (int color = 1; color <= bcc_count; ++color) {
        cout << block[color].size();
        for (int u : block[color]) cout << ' ' << u;
        cout << '\n';
    }
    return 0;
}
