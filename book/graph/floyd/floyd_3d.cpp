#include <bits/stdc++.h>
using namespace std;

// 三维教学版：用于 n <= 50 的有向图，要求无负环。
// d[k][i][j]：只允许 1..k 作为中间点时，i 到 j 的最短距离。
// 输出第 0 层及每次转移后的完整矩阵，方便逐层核对。
const int N = 55;
const long long INF = 1000000000000000000LL;
long long d[N][N][N];
int n, m;

void print_layer(int k) {
    cout << "D[" << k << "]\n";
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            if (j > 1) cout << ' ';
            if (d[k][i][j] == INF)
                cout << "INF";
            else
                cout << d[k][i][j];
        }
        cout << '\n';
    }
    cout << '\n';
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            d[0][i][j] = (i == j ? 0 : INF);

    for (int t = 0; t < m; t++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        d[0][u][v] = min(d[0][u][v], w);
    }
    print_layer(0);

    for (int k = 1; k <= n; k++) {
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                // 不经过新开放的 k：继承上一层。
                d[k][i][j] = d[k - 1][i][j];

                // 经过 k：两段距离都从上一层读取。
                if (d[k - 1][i][k] != INF && d[k - 1][k][j] != INF) {
                    d[k][i][j] = min(d[k][i][j],
                                    d[k - 1][i][k] + d[k - 1][k][j]);
                }
            }
        }
        print_layer(k);
    }
    return 0;
}
