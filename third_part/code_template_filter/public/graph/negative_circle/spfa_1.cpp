// spfa 找负环（基于队列与边数计数法）
#include <iostream>
#include <vector>
#include <queue>

using namespace std;

const long long INF = (1LL << 60);

struct Edge {
    int to;
    long long w;
};

const int maxn = 100000 + 5;
vector<Edge> g[maxn];
long long dis[maxn];
int cnt[maxn];       // 到每个点的最短路经过的边数
bool in_queue[maxn]; // 是否在队列中

void init_graph(int n) {
    for (int i = 1; i <= n; ++i) g[i].clear();
}

void add_edge(int u, int v, long long w) {
    g[u].push_back({v, w});
}

// 返回 true 表示检测到图中存在负环，false 表示无负环
bool spfa_has_negative_cycle(int n) {
    fill(dis + 1, dis + n + 1, 0);
    fill(cnt + 1, cnt + n + 1, 0);
    fill(in_queue + 1, in_queue + n + 1, true);

    queue<int> q;
    // 关键技巧：为了检测全图可能存在的非连通分量上的负环，
    // 相当于建立虚拟超级源点连接所有点（边权0），初始时将 1..n 全员入队！
    for (int i = 1; i <= n; ++i) {
        q.push(i);
    }

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        in_queue[u] = false;

        for (const auto& e : g[u]) {
            int v = e.to;
            if (dis[u] + e.w < dis[v]) {
                dis[v] = dis[u] + e.w;
                cnt[v] = cnt[u] + 1;
                // 若经过的边数达到或超过 n，说明存在至少 n+1 个点，必有回路且该回路为负环
                if (cnt[v] >= n) return true;

                if (!in_queue[v]) {
                    q.push(v);
                    in_queue[v] = true;
                }
            }
        }
    }
    return false;
}
