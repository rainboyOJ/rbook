// 求「最优方案的总数」：01 背包，同时维护最大价值 f[] 与达到该价值的方案数 g[]
// 转移时若价值更大则 g 跟着换，若价值相等则 g 累加
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e5 + 5;
const int MOD = 1e9 + 7;

int n, C;
long long f[maxn];      // f[j]：容量 j 的最大价值
long long g[maxn];      // g[j]：达到 f[j] 的方案数

int main() {
    cin >> n >> C;

    for (int j = 0; j <= C; ++j) { f[j] = 0; g[j] = 1; }   // 什么都不选也是一种方案

    for (int i = 1; i <= n; ++i) {
        int w, v;
        cin >> w >> v;
        for (int j = C; j >= w; --j) {                     // 01 背包，容量倒序
            if (f[j] < f[j - w] + v) {
                f[j] = f[j - w] + v;
                g[j] = g[j - w];
            }
            else if (f[j] == f[j - w] + v) {
                g[j] = (g[j] + g[j - w]) % MOD;
            }
        }
    }
    cout << f[C] << " " << g[C] << endl;
    return 0;
}
