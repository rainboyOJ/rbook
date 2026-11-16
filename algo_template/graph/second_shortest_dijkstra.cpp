#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

struct SecondShortestDijkstra {
    using ll = long long;
    static constexpr ll INF = (1LL << 62);
    static constexpr int maxn = 100000 + 5; // 按题目点数上限设置

    struct Edge {
        int to;
        ll w;
    };

    int n;
    std::vector<Edge> g[maxn];
    ll dis1[maxn]; // 最短距离
    ll dis2[maxn]; // 严格次短距离

    // 数组较大，实例宜放在全局或声明为 static。
    explicit SecondShortestDijkstra(int node_count) : n(node_count) {
        std::fill(dis1, dis1 + n + 1, INF);
        std::fill(dis2, dis2 + n + 1, INF);
    }

    void add_edge(int u, int v, ll w) {
        g[u].push_back({v, w});
    }

    void add_undirected_edge(int u, int v, ll w) {
        add_edge(u, v, w);
        add_edge(v, u, w);
    }

    void run(int s) {
        std::fill(dis1, dis1 + n + 1, INF);
        std::fill(dis2, dis2 + n + 1, INF);

        // State: (当前候选距离, 目标点)
        using State = std::pair<ll, int>;
        std::priority_queue<State, std::vector<State>, std::greater<State>> q;

        dis1[s] = 0;
        q.push({0, s});

        while (!q.empty()) {
            auto [d, u] = q.top();
            q.pop();

            // 如果当前距离比已记录的次短路还要大，则没有任何利用价值，直接跳过
            if (d > dis2[u]) continue;

            for (const auto& e : g[u]) {
                int v = e.to;
                ll nd = d + e.w;

                // 1. 尝试松弛最短路
                if (nd < dis1[v]) {
                    // 原来的最短路降级为次短路
                    dis2[v] = dis1[v];
                    q.push({dis2[v], v});

                    dis1[v] = nd;
                    q.push({dis1[v], v});
                }
                // 2. 无法更新最短路，尝试更新严格次短路
                // 要求 nd 严格大于最短路 dis1[v]，且严格小于当前次短路 dis2[v]
                else if (nd > dis1[v] && nd < dis2[v]) {
                    dis2[v] = nd;
                    q.push({dis2[v], v});
                }
            }
        }
    }
};
