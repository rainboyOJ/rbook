#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

const int MOD = 1000000007;
using Layer = vector<vector<vector<int>>>;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, limit;
    if (!(cin >> n >> limit)) return 0;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    sort(a.begin() + 1, a.end());

    // dp[块数][已占最终端点数][累计费用]
    Layer dp(n + 1, vector<vector<int>>(3, vector<int>(limit + 1)));
    dp[1][0][0] = 1;
    dp[1][1][0] = 2; // 占左端或右端。
    dp[1][2][0] = 1; // 只有 n=1 时能以此状态完成。

    for (int i = 1; i < n; i++) {
        int gap = a[i + 1] - a[i];
        Layer next(n + 1, vector<vector<int>>(3, vector<int>(limit + 1)));

        for (int j = 1; j <= i; j++) {
            for (int b = 0; b <= 2; b++) {
                int extra = (2 * j - b) * gap;
                if (extra > limit) continue;

                for (int cost = 0; cost + extra <= limit; cost++) {
                    int ways = dp[j][b][cost];
                    if (ways == 0) continue;
                    int new_cost = cost + extra;

                    auto add = [&](int blocks, int ends, int choices) {
                        if (choices <= 0) return;
                        int &target = next[blocks][ends][new_cost];
                        target = (target + 1LL * ways * choices) % MOD;
                    };

                    add(j + 1, b, j + 1 - b); // 新建普通块。
                    add(j, b, 2 * j - b);     // 接在一个开放边界。
                    add(j - 1, b, j - 1);     // 合并相邻两块。
                    if (b < 2) {
                        add(j + 1, b + 1, 2 - b); // 新建块并占最终端点。
                        add(j, b + 1, 2 - b);     // 延长最外侧块并占端点。
                    }
                }
            }
        }
        dp.swap(next);
    }

    int ans = 0;
    for (int cost = 0; cost <= limit; cost++) {
        ans = (ans + dp[1][2][cost]) % MOD;
    }
    cout << ans << '\n';
    return 0;
}
