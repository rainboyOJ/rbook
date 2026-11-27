// 插入背包：有重复元素的排列计数
// 给定 n 类物品及每类数量 cnt[i]，求排成长度为 m 的排列总数（对 1e9+7 取模）
#include <bits/stdc++.h>
using namespace std;

const int MAXM = 1005;
const int MOD = 1000000007;

int n, m;
int cnt[MAXM];
long long C[MAXM][MAXM];
long long dp[MAXM], ndp[MAXM];

void init_comb(int limit) {
    for (int i = 0; i <= limit; ++i) {
        C[i][0] = C[i][i] = 1;
        for (int j = 1; j < i; ++j) {
            C[i][j] = (C[i - 1][j - 1] + C[i - 1][j]) % MOD;
        }
    }
}

int main() {
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> cnt[i];

    init_comb(m);

    dp[0] = 1;                                  // 边界：长度为 0 的排列有 1 种
    for (int i = 1; i <= n; ++i) {
        for (int j = 0; j <= m; ++j) ndp[j] = 0;
        for (int j = 0; j <= m; ++j) {
            int up = min(cnt[i], j);
            for (int c = 0; c <= up; ++c) {     // 选 c 个第 i 类物品插入长度 j 的序列
                ndp[j] = (ndp[j] + dp[j - c] * C[j][c]) % MOD;
            }
        }
        for (int j = 0; j <= m; ++j) dp[j] = ndp[j];
    }

    cout << dp[m] << '\n';
    return 0;
}
