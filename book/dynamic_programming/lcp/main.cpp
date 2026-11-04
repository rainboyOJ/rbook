#include <bits/stdc++.h>
using namespace std;

const int maxn = 5005;
// 全局数组自动初始化为 0，第 n 行和第 n 列表示空后缀。
int lcp[maxn][maxn];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    string s;
    cin >> n >> s;

    // lcp[i][j]：从 i、j 开始的两个后缀的最长公共前缀长度。
    // 当前状态依赖右下方的 lcp[i + 1][j + 1]，因此从后向前计算。
    for (int i = n - 1; i >= 0; i--) {
        for (int j = n - 1; j >= 0; j--) {
            if (s[i] == s[j]) {
                lcp[i][j] = lcp[i + 1][j + 1] + 1;
            } else {
                lcp[i][j] = 0;
            }
        }
    }

    int ans = 0;
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            // 相等限制长度不超过 lcp[i][j]，不重叠限制长度不超过 j - i。
            int len = min(lcp[i][j], j - i);
            ans = max(ans, len);
        }
    }

    cout << ans << '\n';
    return 0;
}
