// BFS 求无权图最短路：dist[i] = 从起点 s 到 i 的最少边数，-1 表示不可达
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

int n, m;
vector<int> g[maxn];
int dist[maxn];

void bfs(int s) {
    // 每跑一次 BFS 都要重置距离
    memset(dist, -1, sizeof(dist));

    queue<int> q;
    dist[s] = 0;
    q.push(s);                             // 入队的同时就确定距离

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        for (int v : g[u]) {
            if (dist[v] != -1) continue;   // 已经入过队，不再是第一次到达
            dist[v] = dist[u] + 1;         // BFS 保证这是最短距离
            q.push(v);
        }
    }
}

int main() {
    scanf("%d%d", &n, &m);
    for (int i = 0; i < m; i++) {
        int u, v;
        scanf("%d%d", &u, &v);
        g[u].push_back(v);
        g[v].push_back(u);                 // 有向图删掉这一行
    }

    bfs(1);

    for (int i = 1; i <= n; i++) printf("%d\n", dist[i]);
    return 0;
}
