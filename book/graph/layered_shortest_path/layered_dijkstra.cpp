#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <tuple>
#include <vector>

using namespace std;
using ll = long long;
using State = tuple<ll, int, int>; // (当前费用, 顶点, 已用免费次数)
const ll INF = 1LL << 62;

struct Edge {
    int to;
    ll w;
};

// dis[used][u]：从 s 到 u，恰好使用 used 次免费机会的最小费用。
vector<vector<ll>> layered_dijkstra(const vector<vector<Edge>>& g, int s, int k) {
    int n = static_cast<int>(g.size());
    vector<vector<ll>> dis(k + 1, vector<ll>(n, INF));
    priority_queue<State, vector<State>, greater<State>> q;

    dis[0][s] = 0;
    q.push({0, s, 0});

    while (!q.empty()) {
        auto [du, u, used] = q.top();
        q.pop();
        if (du != dis[used][u]) {
            continue; // 只跳过这个完整状态的过期条目。
        }

        for (const auto& e : g[u]) {
            // 付费通行：仍在第 used 层。
            ll nd = du + e.w;
            if (nd < dis[used][e.to]) {
                dis[used][e.to] = nd;
                q.push({nd, e.to, used});
            }

            // 免费通行：真正走过这条边，并消耗一次机会。
            if (used < k && du < dis[used + 1][e.to]) {
                dis[used + 1][e.to] = du;
                q.push({du, e.to, used + 1});
            }
        }
    }

    return dis;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, k, s, t;
    if (!(cin >> n >> m >> k)) {
        return 0;
    }
    cin >> s >> t;

    // 本例沿用 P4568 的输入：顶点编号为 0..n-1，航线为无向边。
    vector<vector<Edge>> g(n);
    for (int i = 0; i < m; ++i) {
        int u, v;
        ll w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
        g[v].push_back({u, w});
    }

    auto dis = layered_dijkstra(g, s, k);
    ll ans = INF;
    for (int used = 0; used <= k; ++used) {
        ans = min(ans, dis[used][t]);
    }
    cout << (ans == INF ? -1 : ans) << '\n';
    return 0;
}
