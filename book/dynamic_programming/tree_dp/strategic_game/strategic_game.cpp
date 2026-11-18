#include <bits/stdc++.h>
using namespace std;

const int maxn = 1500 + 5;

vector<int> g[maxn];
int f[maxn][2];

void dfs(int u, int fa) {
    f[u][0] = 0;  // 不选 u，先不计入孩子子树的贡献
    f[u][1] = 1;  // 选 u，先计入 u 上的一名士兵

    for (int v : g[u]) {
        if (v == fa) continue;  // 无向边存了两个方向，跳过父节点
        dfs(v, u);
        f[u][0] += f[v][1];               // u 不选，必须选 v 来覆盖边 (u,v)
        f[u][1] += min(f[v][0], f[v][1]);  // u 已覆盖这条边，v 选或不选均可
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 0; i < n; ++i) {
        int u, k;
        cin >> u >> k;
        while (k--) {
            int v;
            cin >> v;
            g[u].push_back(v);
            g[v].push_back(u);  // 输入中每条边只出现一次，这里补齐反向边
        }
    }

    dfs(0, -1);  // 无根树可以任选根；节点编号为 0 到 n-1
    cout << min(f[0][0], f[0][1]) << '\n';
    return 0;
}
