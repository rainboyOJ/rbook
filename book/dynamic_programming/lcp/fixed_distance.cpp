#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    string s;
    cin >> n >> s;

    int ans = 0;
    for (int d = 1; d < n; d++) {
        int cnt = 0;  // 当前距离下，以位置 i 结尾的连续匹配对数。
        for (int i = 0; i + d < n; i++) {
            if (s[i] == s[i + d]) {
                cnt++;
            } else {
                cnt = 0;
            }
            // 取当前匹配段末尾的 len 对，不重叠要求 len <= d。
            int len = min(cnt, d);
            ans = max(ans, len);
        }
    }

    cout << ans << '\n';
    return 0;
}
