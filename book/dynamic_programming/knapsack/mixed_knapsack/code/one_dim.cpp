// 混合背包：一维数组 + 循环方向
// 01 背包容量倒序（保证每件只用一次），完全背包容量正序（允许重复用同一件），
// 多重背包拆成若干件 01 物品
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, C;
int f[maxn];

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) {
        int w, v, p;
        cin >> w >> v >> p;

        if (p == 0) {                       // 完全背包：容量正序
            for (int j = w; j <= C; ++j) f[j] = max(f[j], f[j - w] + v);
        }
        else if (p == 1) {                  // 01 背包：容量倒序
            for (int j = C; j >= w; --j) f[j] = max(f[j], f[j - w] + v);
        }
        else {                              // 多重背包：朴素拆成 p 件
            for (int k = 1; k <= p; ++k) {
                for (int j = C; j >= w; --j) f[j] = max(f[j], f[j - w] + v);
            }
        }
    }
    cout << f[C] << endl;
    return 0;
}
