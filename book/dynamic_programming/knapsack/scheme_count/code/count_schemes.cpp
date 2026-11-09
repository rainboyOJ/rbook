// 求装满容量 C 的方案总数（完全背包模型：每种物品可用无限次）
// 转移从 max 改成累加，容量正序；f[0]=1 表示「什么都不装」这一种方案
// 方案数可能很大，按常见做法对 1e9+7 取模
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e5 + 5;
const int MOD = 1e9 + 7;

int n, C;
int w[maxn];
long long f[maxn];

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) cin >> w[i];

    f[0] = 1;                               // 边界：容量 0 有一种方案（空）
    for (int i = 1; i <= n; ++i) {
        for (int j = w[i]; j <= C; ++j) {   // 正序：允许重复用同一种
            f[j] = (f[j] + f[j - w[i]]) % MOD;
        }
    }
    cout << f[C] << endl;
    return 0;
}
