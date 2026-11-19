#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
const int maxm = 400000 + 5;
struct Edge { int to, id; };
int n, m, timer;
vector<Edge> g[maxn];
int dfn[maxn], parent[maxn], parent_edge[maxn];
int next_edge[maxn], st[maxn];
int len, cycle_v[maxn], cycle_e[maxn];
bool on_vertex[maxn], on_edge[maxm];

void build_cycle(int u, int v, int back_id) {
    // v 是祖先（自环时 u == v），先得到 u 到 v 的逆序点列。
    for (int x = u; x != v; x = parent[x]) cycle_v[len++] = x;
    cycle_v[len++] = v;
    reverse(cycle_v, cycle_v + len);
    for (int i = 0; i + 1 < len; ++i) {
        cycle_e[i] = parent_edge[cycle_v[i + 1]];
    }
    cycle_e[len - 1] = back_id;  // 最后一条边从 u 闭合到 v
    for (int i = 0; i < len; ++i) {
        on_vertex[cycle_v[i]] = true;
        on_edge[cycle_e[i]] = true;
    }
}

bool dfs(int s) {
    int top = 0;
    dfn[s] = ++timer;
    st[top++] = s;
    while (top > 0) {
        int u = st[top - 1];
        if (next_edge[u] == (int)g[u].size()) {
            --top;  // 所有邻边已处理，模拟递归返回
            continue;
        }
        Edge e = g[u][next_edge[u]++];
        if (e.id == parent_edge[u]) continue;  // 只跳过进入 u 的那条边
        int v = e.to;
        if (dfn[v] == 0) {
            parent[v] = u;
            parent_edge[v] = e.id;
            dfn[v] = ++timer;
            st[top++] = v;
        } else if (v == u || dfn[v] < dfn[u]) {
            build_cycle(u, v, e.id);
            return true;  // 只恢复一个环，找到后立即结束
        }
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
        g[u].push_back({v, id});
        g[v].push_back({u, id});
    }
    for (int u = 1; u <= n; ++u) {
        if (dfn[u] == 0 && dfs(u)) break;
    }
    cout << len << '\n';
    if (len == 0) return 0;
    for (int i = 0; i < len; ++i) cout << cycle_v[i] << ' ';
    cout << '\n';
    for (int i = 0; i < len; ++i) cout << cycle_e[i] << ' ';
    cout << '\n';
    return 0;
}
