#include <bits/stdc++.h>
using namespace std;

int n, m;
int s;

typedef long long ll;
typedef pair<ll, ll> State; // (dis, node_id)，距离在前
const ll INF = (1ll << 62);  // 约 4.6e18，加边权不会溢出

const int maxn = 100000 + 5;

struct Edge {
    int to;
    ll w;
};

vector<Edge> g[maxn]; // g[u]：从 u 出发的全部边
ll dis[maxn];         // dis[i]：s 到 i 的当前最短距离

void add_edge(int u, int v, ll w) {
    g[u].push_back({v, w}); // 无向边需要再添加 v -> u
    // g[v].push_back({u, w}); // 无向图
}

void dijkstra(int s) {
    fill(dis, dis + n + 1, INF); // 只需清到 dis[n+1]
    // pq 优化：小根堆，距离小的在上
    // priority_queue 默认是 less（大根），这里用 greater 反转
    priority_queue<State, vector<State>, greater<State>> q;

    dis[s] = 0;
    q.push({0, s});

    while (!q.empty()) {
        // 更像 BFS：每次取出当前距离最小的点
        ll du = q.top().first;
        ll u = q.top().second;
        q.pop();

        if (du > dis[u])
            continue; // 旧记录，不再扫描出边

        for (auto &e : g[u]) {
            // du 一定 < INF（只有 nd < dis[v] <= INF 才会入堆），
            // w 非负，long long 相加不会溢出。
            ll nd = du + e.w;
            if (nd >= dis[e.to])
                continue;
            dis[e.to] = nd;
            // pre[e.to] = u;
            q.push({nd, e.to}); // updated QUEUE
        }
    }
}

int main() {
    cin >> n >> m;
    cin >> s;
    for (int i = 1; i <= m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        add_edge(u, v, w);
    }

    dijkstra(s);

    for (int i = 1; i <= n; i++) {
        cout << dis[i] << " ";
    }
    return 0;
}
