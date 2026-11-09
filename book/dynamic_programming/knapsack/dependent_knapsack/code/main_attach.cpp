// 有依赖的背包（简化版，NOIP2006 金明的预算方案）：每个主件最多 2 个附件
//
// 一个主件和它的附件，可能的买法是：不买、只买主件、主件+附件1、主件+附件2、
// 主件+两个附件 —— 至多 5 种，且互斥。所以「主件及其附件」等价于一个物品组，
// 用分组背包求解：容量倒序，组内枚举买法。
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, C;
int f[maxn];
int w[maxn], v[maxn];

int att1[maxn], att2[maxn];   // 每个主件的第 1、2 个附件的编号，0 表示没有

int main() {
    cin >> n >> C;

    int mainIdx[maxn], mainCnt = 0;
    for (int i = 1; i <= n; ++i) {
        int p;
        cin >> w[i] >> v[i] >> p;
        if (p == 0) mainIdx[++mainCnt] = i;
        else if (att1[p] == 0) att1[p] = i;
        else att2[p] = i;
    }

    for (int t = 1; t <= mainCnt; ++t) {
        int m = mainIdx[t];
        int c1 = att1[m], c2 = att2[m];

        // 先枚举容量（倒序），再枚举这一组的互斥买法
        for (int j = C; j >= 0; --j) {
            int best = f[j];                                   // 不买
            if (j >= w[m])                                     // 只买主件
                best = max(best, f[j - w[m]] + v[m]);
            if (c1 && j >= w[m] + w[c1])                       // 主件 + 附件1
                best = max(best, f[j - w[m] - w[c1]] + v[m] + v[c1]);
            if (c2 && j >= w[m] + w[c2])                       // 主件 + 附件2
                best = max(best, f[j - w[m] - w[c2]] + v[m] + v[c2]);
            if (c1 && c2 && j >= w[m] + w[c1] + w[c2])         // 主件 + 两个附件
                best = max(best, f[j - w[m] - w[c1] - w[c2]] + v[m] + v[c1] + v[c2]);
            f[j] = best;
        }
    }
    cout << f[C] << endl;
    return 0;
}
