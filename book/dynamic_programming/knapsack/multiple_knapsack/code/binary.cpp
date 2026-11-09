// 多重背包：二进制拆分 + 01 背包
// 把 m 件同种物品拆成系数 1,2,4,...,余数 的若干件，
// 任意 0..m 的取法都能由这些系数之和表示，于是转成 01 背包。
// 时间 O(n * C * log m)
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e5 + 5;

int n, C;
int f[maxn];
int iw[maxn * 20], iv[maxn * 20], icnt;   // 拆分后的物品

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) {
        int w, v, m;
        cin >> w >> v >> m;
        for (int k = 1; k <= m; k <<= 1) {          // 1,2,4,...
            iw[++icnt] = k * w; iv[icnt] = k * v;
            m -= k;
        }
        if (m > 0) { iw[++icnt] = m * w; iv[icnt] = m * v; }  // 最后一段
    }

    for (int i = 1; i <= icnt; ++i) {                // 01 背包，容量倒序
        for (int j = C; j >= iw[i]; --j) {
            f[j] = max(f[j], f[j - iw[i]] + iv[i]);
        }
    }
    cout << f[C] << endl;
    return 0;
}
