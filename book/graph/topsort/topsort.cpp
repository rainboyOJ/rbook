#include <bits/stdc++.h>
using namespace std;

int n, m;
vector<vector<int>> e; // e[u] 保存从 u 出发的边的终点
vector<int> in_deg;     // 运行中表示剩余入度，会被 topsort 修改
vector<int> ta;         // 拓扑排序输出的顶点序列

bool topsort() {
    queue<int> q;
    ta.clear();

    for (int u = 1; u <= n; ++u) {
        if (in_deg[u] == 0) q.push(u);
    }

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        ta.push_back(u);

        for (int v : e[u]) {
            --in_deg[v]; // 删除 u -> v，解除一条依赖
            if (in_deg[v] == 0) q.push(v);
        }
    }

    return static_cast<int>(ta.size()) == n;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    e.resize(n + 1);
    in_deg.assign(n + 1, 0);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        e[u].push_back(v);
        ++in_deg[v];
    }

    if (!topsort()) {
        cout << "Cycle\n";
        return 0;
    }

    for (int i = 0; i < n; ++i) {
        if (i > 0) cout << ' ';
        cout << ta[i];
    }
    cout << '\n';
    return 0;
}
