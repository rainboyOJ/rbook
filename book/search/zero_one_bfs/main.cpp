#include <deque>
#include <iostream>
#include <limits>
#include <utility>
#include <vector>
using namespace std;

struct Edge { int to, weight; };
const int INF = numeric_limits<int>::max() / 4;

// graph 的下标是 1..n，边权必须是 0 或 1。
vector<int> zero_one_bfs(const vector<vector<Edge>> &graph, int source) {
    vector<int> dist(graph.size(), INF);
    deque<pair<int, int>> dq; // (入队时的距离快照, 顶点)
    dist[source] = 0;
    dq.push_front({0, source});
    while (!dq.empty()) {
        auto [d, u] = dq.front();
        dq.pop_front();
        if (d != dist[u]) continue; // 旧条目已经过期，不再扩展邻边
        for (auto [v, w] : graph[u]) {
            int next_dist = d + w;
            if (next_dist >= dist[v]) continue; // 必须严格变小，避免 0 权环重复入队
            dist[v] = next_dist;
            if (w == 0) dq.push_front({next_dist, v});
            else dq.push_back({next_dist, v});
        }
    }
    return dist;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, source, target;
    if (!(cin >> n >> source >> target)) return 0;
    vector<vector<Edge>> graph(n + 1);
    for (int u = 1; u <= n; ++u) {
        int k;
        cin >> k;
        for (int j = 0; j < k; ++j) {
            int v;
            cin >> v;
            graph[u].push_back({v, j == 0 ? 0 : 1});
        }
    }
    auto dist = zero_one_bfs(graph, source);
    cout << (dist[target] == INF ? -1 : dist[target]) << '\n';
}
