// 混合背包：朴素写法
// 每件物品给 w v p：p=1 只能用一次（01），p=0 能用无限次（完全），p>1 最多用 p 次（多重）
// 按类别分别处理，f[i][j] 前 i 件、容量 j 的最大价值
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, C;
int w[maxn], v[maxn], p[maxn];
int f[maxn][maxn];

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) cin >> w[i] >> v[i] >> p[i];

    for (int i = 1; i <= n; ++i) {
        for (int j = 0; j <= C; ++j) {
            f[i][j] = f[i - 1][j];                        // 一件也不选
            int limit = (p[i] == 0) ? j / w[i] : min(p[i], j / w[i]);
            for (int k = 1; k <= limit; ++k) {            // 枚举选几件
                f[i][j] = max(f[i][j], f[i - 1][j - k * w[i]] + k * v[i]);
            }
        }
    }
    cout << f[n][C] << endl;
    return 0;
}
