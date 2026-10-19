#include <algorithm>
#include <queue>
#include <vector>

const int maxn = 100000 + 5;
const long long INF = (1LL << 62);

struct edge {
    int to;
    long long w;
};

std::vector<edge> g[maxn];
long long dis[maxn];
int cnt[maxn];       // 当前 dis 对应的历史路径的边数，不是更新次数
bool in_queue[maxn]; // 当前是否在队列中，出队后必须清除

// 点编号为 1..n；换一张图前调用，避免多组数据残留旧边。
void init_graph(int n) {
    for (int u = 1; u <= n; ++u) g[u].clear();
}

void add_edge(int u, int v, long long w) {
    g[u].push_back({v, w});
}

// true：得到单源最短路；false：发现从 s 可达的负环。
// 要求 1 <= s <= n < maxn，所有参与运算的距离与边权和均在 (-INF, INF) 内。
bool spfa(int n, int s) {
    std::fill(dis + 1, dis + n + 1, INF);
    std::fill(cnt + 1, cnt + n + 1, 0);
    std::fill(in_queue + 1, in_queue + n + 1, false);
    std::queue<int> q; // 局部队列保证重复调用时没有上次留下的点

    dis[s] = 0;
    q.push(s);
    in_queue[s] = true;

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        in_queue[u] = false;

        for (const auto& e : g[u]) {
            int v = e.to;
            long long candidate = dis[u] + e.w; // 入队点一定可达
            if (candidate >= dis[v]) continue;

            dis[v] = candidate;
            cnt[v] = cnt[u] + 1;
            if (cnt[v] >= n) return false;

            // 即使 v 已在队列中，也必须先更新 dis 和 cnt。
            if (!in_queue[v]) {
                q.push(v);
                in_queue[v] = true;
            }
        }
    }
    return true;
}
