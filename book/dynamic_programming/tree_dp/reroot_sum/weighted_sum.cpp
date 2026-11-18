#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 200000 + 5;

struct Edge {
    int to;
    ll w;
};

vector<Edge> g[maxn];
int fa[maxn], order[maxn];
ll weight[maxn], sub[maxn], down[maxn], ans[maxn], parent_len[maxn];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int u = 1; u <= n; ++u) cin >> weight[u];
    for (int i = 1; i < n; ++i) {
        int u, v;
        ll len;
        cin >> u >> v >> len;
        g[u].push_back({v, len});
        g[v].push_back({u, len});
    }

    order[1] = 1;
    int total = 1;
    for (int i = 1; i <= total; ++i) {
        int u = order[i];
        for (auto [v, len] : g[u]) {
            if (v == fa[u]) continue;
            fa[v] = u;
            parent_len[v] = len;
            order[++total] = v;
        }
    }

    for (int i = total; i >= 1; --i) {
        int u = order[i];
        sub[u] = weight[u];
        for (auto [v, len] : g[u]) {
            if (v == fa[u]) continue;
            sub[u] += sub[v];
            down[u] += down[v] + sub[v] * len;
        }
    }

    ans[1] = down[1];
    ll total_weight = sub[1];
    for (int i = 2; i <= total; ++i) {
        int v = order[i], u = fa[v];
        ans[v] = ans[u] + (total_weight - 2 * sub[v]) * parent_len[v];
    }

    for (int u = 1; u <= n; ++u) {
        cout << ans[u] << (u == n ? '\n' : ' ');
    }
    return 0;
}
