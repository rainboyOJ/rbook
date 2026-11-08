#include <bits/stdc++.h>
using namespace std;

// Floyd 全源最短路竞赛精简版：有向图，要求无负环。
// 输入 n m 与 m 条边 u v w，输出最短路矩阵，不可达输出 INF。
// 点编号 1..n，要求 n < N；有限距离的绝对值小于 INF，距离相加不溢出。
// 口诀：中转点 k 最外层，两段都可达才相加。
const int N = 410;
const long long INF = 1'000'000'000'000'000'000LL;
long long d[N][N];
int n, m;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            d[i][j] = (i == j ? 0 : INF);

    for (int i = 0; i < m; i++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        d[u][v] = min(d[u][v], w); // 重边取最小；无向图还需更新 d[v][u]
    }

    for (int k = 1; k <= n; k++) // 中转点必须在最外层，内层 i、j 可以交换
        for (int i = 1; i <= n; i++) {
            if (d[i][k] == INF) continue;
            for (int j = 1; j <= n; j++) {
                if (d[k][j] == INF) continue;
                d[i][j] = min(d[i][j], d[i][k] + d[k][j]);
            }
        }

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            if (d[i][j] == INF) cout << "INF";
            else cout << d[i][j];
            cout << " \n"[j == n];
        }
    }
    return 0;
}
