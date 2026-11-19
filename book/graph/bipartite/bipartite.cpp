#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
int n, m;
vector<int> g[maxn];
int color[maxn], q[maxn];  // 0：未染色；1、2：两种颜色

bool bfs(int s) {
    int head = 0, tail = 0;
    color[s] = 1;
    q[tail++] = s;
    while (head < tail) {
        int u = q[head++];
        for (int v : g[u]) {
            if (color[v] == 0) {
                color[v] = 3 - color[u];  // 入队前染色，避免重复入队
                q[tail++] = v;
            } else if (color[v] == color[u]) {
                return false;  // 同一条边的两端被强制成同色
            }
        }
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> m)) return 0;
    for (int i = 1; i <= m; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    for (int u = 1; u <= n; ++u) {
        // 每个尚未染色的点代表一个新的连通块，孤立点也会被处理。
        if (color[u] == 0 && !bfs(u)) {
            cout << "No\n";
            return 0;
        }
    }
    cout << "Yes\n";
    return 0;
}
