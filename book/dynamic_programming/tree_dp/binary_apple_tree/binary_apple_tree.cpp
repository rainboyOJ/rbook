#include <bits/stdc++.h>
using namespace std;

const int maxn = 100 + 5;
const int NEG = -1000000000;

struct Edge {
    int to, w;
};

vector<Edge> g[maxn];
int f[maxn][maxn], sz[maxn];
int n, q, K;

void dfs(int u, int fa, int value) {
    for (int j = 0; j <= K; ++j) f[u][j] = NEG;
    f[u][0] = 0;      // 整棵子树都不取
    f[u][1] = value;  // 只取 u；value 是父边转移到 u 上的点权
    sz[u] = 1;
    int next[maxn];

    for (auto [v, w] : g[u]) {
        if (v == fa) continue;
        dfs(v, u, w);
        fill(next, next + K + 1, NEG);

        // a 个点来自 u 和之前合并的孩子，必须包含 u。
        for (int a = 1; a <= min(sz[u], K); ++a) {
            if (f[u][a] == NEG) continue;
            // b=0 表示不取当前孩子子树；b>0 时必须包含 v。
            for (int b = 0; b <= min(sz[v], K - a); ++b) {
                if (f[v][b] == NEG) continue;
                next[a + b] = max(next[a + b], f[u][a] + f[v][b]);
            }
        }
        for (int j = 1; j <= K; ++j) f[u][j] = next[j];
        sz[u] += sz[v];  // 合并完成后再扩大已处理部分的规模
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> q;
    K = q + 1;  // 保留 q 条边，等价于保留包含根的 q+1 个点
    for (int i = 1; i < n; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
        g[v].push_back({u, w});
    }

    dfs(1, 0, 0);  // 根没有父边，转移后的点权为 0
    cout << f[1][K] << '\n';
    return 0;
}
