// 多重背包：朴素三重循环
// f[i][j] 前 i 种物品、容量 j 的最大价值，第 i 种可用 m[i] 件
// 时间 O(n * C * sum(m))，直接按「第 i 种选几件」枚举
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, C;
int w[maxn], v[maxn], m[maxn];
int f[maxn][maxn];

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) cin >> w[i] >> v[i] >> m[i];

    for (int i = 1; i <= n; ++i) {
        for (int j = 0; j <= C; ++j) {
            f[i][j] = f[i - 1][j];              // 第 i 种选 0 件
            for (int k = 1; k <= m[i] && k * w[i] <= j; ++k) {
                f[i][j] = max(f[i][j], f[i - 1][j - k * w[i]] + k * v[i]);
            }
        }
    }
    cout << f[n][C] << endl;
    return 0;
}
