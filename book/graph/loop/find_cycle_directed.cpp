#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
struct Edge { int to, id; };
int n, m;
vector<Edge> g[maxn];
int color[maxn], parent[maxn], parent_edge[maxn];
int next_edge[maxn], st[maxn];
int len, cycle_v[maxn], cycle_e[maxn];

void build_cycle(int u, int v, int back_id) {
    for (int x = u; x != v; x = parent[x]) cycle_v[len++] = x;
    cycle_v[len++] = v;
    reverse(cycle_v, cycle_v + len);
    for (int i = 0; i + 1 < len; ++i) {
        cycle_e[i] = parent_edge[cycle_v[i + 1]];
    }
    cycle_e[len - 1] = back_id;
}

bool dfs(int s) {
    int top = 0;
    color[s] = 1;
    st[top++] = s;
    while (top > 0) {
        int u = st[top - 1];
        if (next_edge[u] == (int)g[u].size()) {
            color[u] = 2;  // 退出当前 DFS 路径
            --top;
            continue;
        }
        Edge e = g[u][next_edge[u]++];
        int v = e.to;
        if (color[v] == 0) {
            parent[v] = u;
            parent_edge[v] = e.id;
            color[v] = 1;
            st[top++] = v;
        } else if (color[v] == 1) {
            // v 仍在当前路径上，树路径 v -> ... -> u 与 u -> v 闭合。
            build_cycle(u, v, e.id);
            return true;
        }
        // 指向 color == 2 的点不能据此判环；有向图不跳过“父亲边”。
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> m)) return 0;
    for (int id = 1; id <= m; ++id) {
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});  // 有向边只存一次
    }
    for (int u = 1; u <= n; ++u) {
        if (color[u] == 0 && dfs(u)) break;
    }
    cout << len << '\n';
    if (len == 0) return 0;
    for (int i = 0; i < len; ++i) cout << cycle_v[i] << ' ';
    cout << '\n';
    for (int i = 0; i < len; ++i) cout << cycle_e[i] << ' ';
    cout << '\n';
    return 0;
}
