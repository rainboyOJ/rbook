#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
struct Edge { int to, id; };
int n, m, deg[maxn], q[maxn];
vector<Edge> g[maxn];
bool in_cycle[maxn];
int len, cycle_v[maxn], cycle_e[maxn];

void peel() {
    int head = 0, tail = 0;
    for (int u = 1; u <= n; ++u) {
        in_cycle[u] = true;
        if (deg[u] <= 1) q[tail++] = u;
    }
    while (head < tail) {
        int u = q[head++];
        in_cycle[u] = false;
        for (Edge e : g[u]) {
            int v = e.to;
            if (!in_cycle[v]) continue;
            if (--deg[v] == 1) q[tail++] = v;
        }
    }
}

void walk_cycle(int start) {
    int u = start, in_edge = 0;
    do {
        cycle_v[len] = u;
        for (Edge e : g[u]) {
            if (!in_cycle[e.to] || e.id == in_edge) continue;
            cycle_e[len++] = e.id;
            in_edge = e.id;
            u = e.to;
            break;
        }
    } while (u != start);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // 本模板用于连通基环树；沿环走一圈依赖这个前提。
    if (!(cin >> n >> m)) return 0;
    for (int id = 1; id <= m; ++id) {
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});
        g[v].push_back({u, id});
        ++deg[u];
        ++deg[v];  // 自环对度数贡献 2
    }
    peel();
    for (int u = 1; u <= n; ++u) {
        if (in_cycle[u]) {
            walk_cycle(u);
            break;
        }
    }
    cout << len << '\n';
    if (len == 0) return 0;
    for (int i = 0; i < len; ++i) cout << cycle_v[i] << ' ';
    cout << '\n';
    for (int i = 0; i < len; ++i) cout << cycle_e[i] << ' ';
    cout << '\n';
    return 0;
}
