#include <bits/stdc++.h>
using namespace std;

const int MAXN = 5000 + 5; // 点数上界 N <= 5000
const long long INF = (1LL << 60);

struct Edge {
    int to; // 边指向的点
    int w;  // 边的长度
};

struct HeapNode {
    int u;
    long long dist;

    // 小根堆：距离大的排后面
    bool operator<(const HeapNode &other) const {
        return dist > other.dist;
    }
};

int n, r;
vector<Edge> g[MAXN];  // g[u]：从 u 出发的全部边
long long dist1[MAXN]; // 到 i 的最短距离
long long dist2[MAXN]; // 到 i 的次短距离，要求严格大于 dist1[i]

void add_edge(int u, int v, int len) {
    g[u].push_back({v, len});
}

void dijkstra() {
    for (int i = 1; i <= n; i++) {
        dist1[i] = INF;
        dist2[i] = INF;
    }

    priority_queue<HeapNode> pq;
    dist1[1] = 0;
    pq.push({1, 0});

    while (!pq.empty()) {
        HeapNode cur = pq.top();
        pq.pop();

        int u = cur.u;
        long long d = cur.dist;

        // 这条记录既不是最短路也不是次短路，早已被更优的值取代，展开它无益
        if (d > dist2[u]) continue;

        for (const Edge &e : g[u]) {
            int v = e.to;
            long long nd = d + e.w;

            // 找到了更短的最短路：旧的最短路是真实路径，不能丢，
            // 通过交换把它降级成次短候选（交换后 nd 就是旧的最短路值）
            if (nd < dist1[v]) {
                std::swap(nd, dist1[v]);
                pq.push({v, dist1[v]});
            }

            // 只接受严格大于最短路、且能改善次短的候选。
            // 长度等于最短路的另一条路径不算次短路，所以这里是 < 而不是 <=
            if (dist1[v] < nd && nd < dist2[v]) {
                dist2[v] = nd;
                pq.push({v, dist2[v]});
            }
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> r;

    for (int i = 1; i <= r; i++) {
        int u, v, len;
        cin >> u >> v >> len;
        add_edge(u, v, len);
        add_edge(v, u, len); // 道路双向
    }

    dijkstra();

    cout << dist2[n] << '\n';
    return 0;
}
