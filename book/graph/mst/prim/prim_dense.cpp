#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
const int maxn = 2000 + 5;  // 邻接矩阵版本只用于 n <= 2000
const ll INF = 1LL << 62;
ll g[maxn][maxn], dis[maxn];
int pre[maxn];
bool vis[maxn];

bool prim(int n, ll &answer) {
    for (int i = 1; i <= n; ++i) {
        dis[i] = INF;
        pre[i] = 0;
        vis[i] = false;
    }
    dis[1] = 0;  // 第一个点没有入树边，这个 0 不代表原图中的边
    answer = 0;
    for (int step = 1; step <= n; ++step) {
        int u = 0;
        for (int v = 1; v <= n; ++v) {
            if (!vis[v] && (u == 0 || dis[v] < dis[u])) u = v;
        }
        if (u == 0 || dis[u] == INF) return false;
        vis[u] = true;
        answer += dis[u];
        for (int v = 1; v <= n; ++v) {
            if (!vis[v] && g[u][v] < dis[v]) {
                dis[v] = g[u][v];  // 最便宜的入树边；这里不加 dis[u]
                pre[v] = u;
            }
        }
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= n; ++j) g[i][j] = INF;
    }
    for (int i = 0; i < m; ++i) {
        int u, v;
        ll w;
        cin >> u >> v >> w;
        if (u == v) continue;
        g[u][v] = g[v][u] = min(g[u][v], w);  // 重边只保留最小值
    }
    ll answer;
    if (prim(n, answer)) cout << answer << '\n';
    else cout << "orz\n";
    return 0;
}
