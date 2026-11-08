#include <bits/stdc++.h>
using namespace std;

const int maxn = 100000 + 5; // 定长数组上限，按题目数据范围调整

int n, m;
vector<int> g[maxn]; // g[u] 保存从 u 出发的边的终点
int in_deg[maxn];    // 运行中表示剩余入度，会被 topsort 修改
vector<int> ta;      // 拓扑排序输出的顶点序列

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

        for (int v : g[u]) {
            --in_deg[v]; // 删除 u -> v，解除一条依赖
            if (in_deg[v] == 0) q.push(v);
        }
    }

    // 是否无环（DAG）
    return ta.size() == n;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;

    // 多组数据时清掉上一组的边和入度
    for (int u = 1; u <= n; ++u) {
        g[u].clear();
        in_deg[u] = 0;
    }

    // 读取数据
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        ++in_deg[v];
    }

    // 执行 top sort
    if (!topsort()) {
        cout << "Cycle\n";
        return 0;
    }

    for (auto u : ta) cout << u << " ";
    cout << '\n';
    return 0;
}
