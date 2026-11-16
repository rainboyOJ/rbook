// 输入 n m，接着 m 条无向边；从 1 出发，逐行输出各点的最少边数。
#include <algorithm>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

const int maxn = 100000 + 5; // 按题目点数上限设置

int n, m;
vector<int> g[maxn];
int dist[maxn], parent[maxn];

void bfs(int s) {
    fill(dist, dist + n + 1, -1);
    fill(parent, parent + n + 1, -1);
    queue<int> q;
    dist[s] = 0;
    q.push(s);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : g[u]) {
            if (dist[v] != -1) continue;
            dist[v] = dist[u] + 1;
            parent[v] = u; // 第一次发现 v 时，记录从谁走来
            q.push(v);
        }
    }
}

vector<int> get_path(int t) {
    if (dist[t] == -1) return {};
    vector<int> path;
    for (int v = t; v != -1; v = parent[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return path;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    if (!(cin >> n >> m)) return 0;
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u); // 有向图删掉这一行
    }
    bfs(1);
    for (int i = 1; i <= n; ++i) cout << dist[i] << '\n';
    return 0;
}
