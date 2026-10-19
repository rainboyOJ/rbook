#include <algorithm>
#include <iostream>
#include <vector>

const long long INF = (1LL << 60);

struct Edge {
    int u, v;
    long long w;
};

// 点编号为 1..n；返回 true 表示成功求得最短路，false 表示存在从源点可达的负环
bool bellman_ford(int n, const std::vector<Edge>& edges, int s, std::vector<long long>& dis) {
    dis.assign(n + 1, INF);
    dis[s] = 0;

    // 运行至多 n - 1 轮松弛
    for (int round = 1; round <= n - 1; ++round) {
        bool changed = false;
        for (const auto& e : edges) {
            if (dis[e.u] == INF) continue; // 源点尚不可达，不能拿 INF 参与相加
            if (dis[e.u] + e.w < dis[e.v]) {
                dis[e.v] = dis[e.u] + e.w;
                changed = true;
            }
        }
        // 如果某一轮没有发生任何松弛，说明所有最短路已经确定，可以提前退出
        if (!changed) break;
    }

    // 第 n 轮检测负环：若还能继续松弛，说明存在负环
    for (const auto& e : edges) {
        if (dis[e.u] == INF) continue;
        if (dis[e.u] + e.w < dis[e.v]) {
            return false; // 存在从 s 可达的负环
        }
    }
    return true;
}
