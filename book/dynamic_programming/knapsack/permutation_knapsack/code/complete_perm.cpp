// 完全背包求排列数（考虑放入顺序）：外层枚举容量，内层枚举物品
// f[j] = 体积恰好为 j 的有序放入方案数；f[0] = 1
#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1005;
const int MOD = 1000000007;

int n, V;
int v[MAXN];
long long f[MAXN];

int main() {
    cin >> n >> V;
    for (int i = 1; i <= n; ++i) cin >> v[i];

    f[0] = 1;                                   // 边界：总体积为 0 有 1 种空方案
    for (int j = 1; j <= V; ++j) {              // 外层枚举当前总体积
        for (int i = 1; i <= n; ++i) {          // 内层枚举最后一个放入的物品
            if (j >= v[i]) {
                f[j] = (f[j] + f[j - v[i]]) % MOD;
            }
        }
    }

    cout << f[V] << '\n';
    return 0;
}
