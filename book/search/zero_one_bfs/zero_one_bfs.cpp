#include <algorithm>
#include <deque>
#include <iostream>
#include <limits>
#include <utility>
#include <vector>
using namespace std;

struct Edge { int to, weight; };
const int INF = numeric_limits<int>::max() / 4;
const int maxn = 100000 + 5; // 按题目点数上限设置

vector<Edge> g[maxn];
int dist[maxn];

// 顶点编号为 1..n，边权必须是 0 或 1；结果保存在 dist 中。
void zero_one_bfs(int n, int source) {
    fill(dist, dist + n + 1, INF);
    deque<pair<int, int>> dq; // (入队时的距离快照, 顶点)
    dist[source] = 0;
    dq.push_front({0, source});
    while (!dq.empty()) {
        auto [d, u] = dq.front();
        dq.pop_front();
        if (d != dist[u]) continue; // 旧条目已经过期，不再扩展邻边
        for (auto [v, w] : g[u]) {
            int next_dist = d + w;
            if (next_dist >= dist[v]) continue; // 必须严格变小，避免 0 权环重复入队
            dist[v] = next_dist;
            if (w == 0) dq.push_front({next_dist, v});
            else dq.push_back({next_dist, v});
        }
    }
}

// 输入 n m s，接着 m 行 u v w（有向边，w 只能是 0 或 1）。
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m, s;
    if (!(cin >> n >> m >> s)) return 0;
    for (int i = 0; i < m; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
    }
    zero_one_bfs(n, s);
    for (int v = 1; v <= n; ++v) cout << (dist[v] == INF ? -1 : dist[v]) << '\n';
}
