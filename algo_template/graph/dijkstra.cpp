#include <algorithm>
#include <functional>
#include <queue>
#include <utility>
#include <vector>

struct Dijkstra {
    using ll = long long;
    static constexpr ll INF = (1LL << 62);
    static constexpr int maxn = 100000 + 5; // 按题目点数上限设置

    struct Edge {
        int to;
        ll w;
    };

    int n;
    std::vector<Edge> g[maxn];
    ll dis[maxn];
    int pre[maxn];

    // 点编号 1..n；所有边权非负，有限最短距离必须小于 INF。
    // 数组较大，实例宜放在全局或声明为 static。
    explicit Dijkstra(int node_count) : n(node_count) {
        std::fill(dis, dis + n + 1, INF);
        std::fill(pre, pre + n + 1, -1);
    }

    void add_edge(int u, int v, ll w) {
        g[u].push_back({v, w}); // 无向边需要再添加 v -> u
    }

    void run(int s) {
        std::fill(dis, dis + n + 1, INF);
        std::fill(pre, pre + n + 1, -1);
        using State = std::pair<ll, int>; // 距离在前，点编号在后
        std::priority_queue<State, std::vector<State>, std::greater<State>> q;
        dis[s] = 0;
        q.push({0, s});

        while (!q.empty()) {
            auto [du, u] = q.top();
            q.pop();
            if (du != dis[u]) continue; // 旧记录不再扫描出边

            for (const auto& e : g[u]) {
                // du < INF，且 w >= 0；先判断再相加，避免溢出。
                if (e.w >= INF - du) continue;
                ll nd = du + e.w;
                if (nd >= dis[e.to]) continue; // 只接受严格改善
                dis[e.to] = nd;
                pre[e.to] = u;
                q.push({nd, e.to});
            }
        }
    }

    // run 后使用；不可达返回空数组，否则返回一条最短路径。
    std::vector<int> path_to(int t) const {
        if (dis[t] == INF) return {};
        std::vector<int> path;
        for (int u = t; u != -1; u = pre[u]) path.push_back(u);
        std::reverse(path.begin(), path.end());
        return path;
    }
};
