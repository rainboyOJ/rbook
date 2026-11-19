#include <bits/stdc++.h>
using namespace std;

const int maxn = 105;
const int maxs = 1 << 20;
const int INF = 1e9;
int n, m, k, pack[maxn], f[maxs];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m >> k;
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= k; ++j) {
            int x;
            cin >> x;
            pack[i] |= 1 << (x - 1);  // 第 x 种口味对应第 x-1 位
        }
    }

    int full = (1 << m) - 1;
    fill(f, f + full + 1, INF);
    f[0] = 0;  // 不买糖果，覆盖空集合
    for (int i = 1; i <= n; ++i) {
        // nxt >= mask；倒序使本包产生的新状态不会再次作为来源。
        for (int mask = full; mask >= 0; --mask) {
            if (f[mask] == INF) continue;
            int nxt = mask | pack[i];
            // 不买本包的答案保留在原数组中，下面只处理买本包。
            f[nxt] = min(f[nxt], f[mask] + 1);
        }
    }

    cout << (f[full] == INF ? -1 : f[full]) << '\n';
    return 0;
}
