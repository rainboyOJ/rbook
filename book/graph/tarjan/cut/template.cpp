#include <bits/stdc++.h>
using namespace std;

const int maxn = 20000 + 5;  // 按题目点数上限设置

struct Edge {
    int to, id;
};

vector<Edge> g[maxn];
int dfn[maxn], low[maxn];
bool cut[maxn];
int timer = 0;

void dfs(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;
    int children = 0;

    for (auto [v, id] : g[u]) {
        if (id == in_edge) continue;  // 只跳过进入 u 的那条边
        if (!dfn[v]) {
            ++children;
            dfs(v, id);
            low[u] = min(low[u], low[v]);
            if (in_edge != -1 && low[v] >= dfn[u]) {
                cut[u] = true;
            }
        } else if (dfn[v] < dfn[u]) {  // 回边指向祖先
            low[u] = min(low[u], dfn[v]);
        }
    }

    if (in_edge == -1) cut[u] = (children >= 2);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;

    for (int id = 0; id < m; ++id) {
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});
        g[v].push_back({u, id});
    }

    for (int u = 1; u <= n; ++u) {
        if (!dfn[u]) dfs(u, -1);
    }

    vector<int> answer;
    for (int u = 1; u <= n; ++u) {
        if (cut[u]) answer.push_back(u);
    }
    cout << answer.size() << '\n';
    for (int u : answer) cout << u << ' ';
    cout << '\n';
    return 0;
}
