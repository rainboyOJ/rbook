#include <bits/stdc++.h>
using namespace std;

struct Edge {
    int to, id;
};

vector<vector<Edge>> g;
vector<int> dfn, low;
vector<pair<int, int>> bridges;
int timer = 0;

void dfs(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;

    for (auto [v, id] : g[u]) {
        if (id == in_edge) continue;  // 只跳过进入 u 的那条边
        if (!dfn[v]) {
            dfs(v, id);
            low[u] = min(low[u], low[v]);
            if (low[v] > dfn[u]) {
                bridges.push_back({min(u, v), max(u, v)});
            }
        } else if (dfn[v] < dfn[u]) {
            low[u] = min(low[u], dfn[v]);
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    g.resize(n + 1);
    dfn.assign(n + 1, 0);
    low.assign(n + 1, 0);

    for (int id = 0; id < m; ++id) {
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});
        g[v].push_back({u, id});
    }

    for (int u = 1; u <= n; ++u) {
        if (!dfn[u]) dfs(u, -1);
    }

    sort(bridges.begin(), bridges.end());
    for (auto [u, v] : bridges) {
        cout << u << ' ' << v << '\n';
    }
    return 0;
}
