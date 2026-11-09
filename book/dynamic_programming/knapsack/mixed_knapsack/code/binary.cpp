// 混合背包：多重部分用二进制拆分
// 把 p 件拆成系数 1,2,4,...,余数 的若干件，任意 0..p 的取法都能凑出，
// 于是多重背包也变成一堆 01 物品
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, C;
int f[maxn];
int iw[maxn * 20], iv[maxn * 20], icnt;

void zero_one(int w, int v) {              // 一件 01 物品
    for (int j = C; j >= w; --j) f[j] = max(f[j], f[j - w] + v);
}

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) {
        int w, v, p;
        cin >> w >> v >> p;

        if (p == 0) {                       // 完全背包：直接正序
            for (int j = w; j <= C; ++j) f[j] = max(f[j], f[j - w] + v);
        }
        else {                              // 01 与多重统一按件拆开
            for (int k = 1; k <= p; k <<= 1) { zero_one(k * w, k * v); p -= k; }
            if (p > 0) zero_one(p * w, p * v);
        }
    }
    cout << f[C] << endl;
    return 0;
}
