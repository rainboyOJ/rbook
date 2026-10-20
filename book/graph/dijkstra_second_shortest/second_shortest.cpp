#include <algorithm>
#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

struct SecondShortestDijkstra {
    using ll = long long;
    static constexpr ll INF = (1LL << 62);

    struct Edge {
        int to;
        ll w;
    };

    int n;
    std::vector<std::vector<Edge>> g;
    std::vector<ll> dis1; // 最短距离
    std::vector<ll> dis2; // 严格次短距离

    explicit SecondShortestDijkstra(int n)
        : n(n), g(n + 1), dis1(n + 1, INF), dis2(n + 1, INF) {}

    void add_edge(int u, int v, ll w) {
        g[u].push_back({v, w});
    }

    void add_undirected_edge(int u, int v, ll w) {
        add_edge(u, v, w);
        add_edge(v, u, w);
    }

    void run(int s) {
        std::fill(dis1.begin(), dis1.end(), INF);
        std::fill(dis2.begin(), dis2.end(), INF);

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
