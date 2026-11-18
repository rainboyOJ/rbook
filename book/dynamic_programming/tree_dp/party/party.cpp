#include <bits/stdc++.h>
using namespace std;

const int maxn = 6000 + 5;

vector<int> g[maxn];  // g[u] 只保存 u 的直接下属
int happy[maxn], f[maxn][2];
bool has_parent[maxn];

void dfs(int u) {
    f[u][0] = 0;         // 不选 u，先不计入任何孩子子树的贡献
    f[u][1] = happy[u];  // 选 u，先计入 u 自己的快乐值

    for (int v : g[u]) {
        dfs(v);  // 先求出孩子子树的两个状态，再合并到 u
        f[u][0] += max(f[v][0], f[v][1]);  // u 不选，v 可以选或不选
        f[u][1] += f[v][0];               // u 选了，v 只能不选
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int u = 1; u <= n; ++u) cin >> happy[u];

    for (int i = 1; i < n; ++i) {
        int child, parent;
        cin >> child >> parent;  // 输入顺序：下属、直接上司
        g[parent].push_back(child);
        has_parent[child] = true;
    }

    int root = 1;
    while (has_parent[root]) ++root;  // 唯一没有上司的职员是根

    dfs(root);
    cout << max(f[root][0], f[root][1]) << '\n';
    return 0;
}
