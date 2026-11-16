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

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, source, target;
    if (!(cin >> n >> source >> target)) return 0;
    for (int u = 1; u <= n; ++u) {
        int k;
        cin >> k;
        for (int j = 0; j < k; ++j) {
            int v;
            cin >> v;
            g[u].push_back({v, j == 0 ? 0 : 1});
        }
    }
    zero_one_bfs(n, source);
    cout << (dist[target] == INF ? -1 : dist[target]) << '\n';
}
