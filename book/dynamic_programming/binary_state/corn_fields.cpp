#include <bits/stdc++.h>
using namespace std;

const int maxn = 15;
const int maxs = 400;  // 12 列、不含相邻 1 的单行状态共 377 种
const int MOD = 100000000;
int n, m, allow[maxn], state[maxs], cnt, f[2][maxs];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= m; ++j) {
            int x;
            cin >> x;
            if (x == 1) allow[i] |= 1 << (m - j);  // 最左列对应最高位
        }
    }

    for (int mask = 0; mask < (1 << m); ++mask) {
        if ((mask & (mask << 1)) == 0) state[cnt++] = mask;
    }
    // state[0] = 0。f 的下标是合法状态编号，不是原始掩码。
    f[0][0] = 1;
    for (int row = 1; row <= n; ++row) {
        int now = row & 1, pre = now ^ 1;
        fill(f[now], f[now] + cnt, 0);  // 清空复用的这一层
        for (int a = 0; a < cnt; ++a) {
            int cur = state[a];
            if ((cur & allow[row]) != cur) continue;  // 不能种在贫瘠格
            for (int b = 0; b < cnt; ++b) {
                int last = state[b];
                if ((cur & last) != 0) continue;  // 上下两格不能同时种
                f[now][a] += f[pre][b];
                if (f[now][a] >= MOD) f[now][a] -= MOD;
            }
        }
    }

    int ans = 0;
    for (int a = 0; a < cnt; ++a) {
        ans += f[n & 1][a];
        if (ans >= MOD) ans -= MOD;
    }
    cout << ans << '\n';
    return 0;
}
