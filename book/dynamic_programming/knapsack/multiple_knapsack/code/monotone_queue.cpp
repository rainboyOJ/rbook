// 多重背包：单调队列优化到 O(nC)
//
// 关键观察：按容量 j 对 w 取模余数 r 分组，同一组里的 j 排成
//   r, r+w, r+2w, ...
// 设 j = r + q*w，则转移
//   f[i][j] = max{ f[i-1][j-k*w] + k*v }  (0 <= k <= m)
// 令 g[q] = f[i-1][r+q*w] - q*v，可化成
//   f[i][r+q*w] = q*v + max{ g[p] | q-m <= p <= q }
// 这是滑动窗口最大值，用单调队列 O(1) 均摊求解。
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e5 + 5;

int n, C;
long long f[maxn], g[maxn];
int q[maxn];                       // 单调队列，存下标 p

int main() {
    cin >> n >> C;

    for (int i = 1; i <= n; ++i) {
        int w, v, m;
        cin >> w >> v >> m;
        if (m > C / w) m = C / w;  // 超过容量上限的件数没有意义

        for (int r = 0; r < w && r <= C; ++r) {
            int cnt = (C - r) / w;         // 这一组有 cnt+1 个位置
            for (int p = 0; p <= cnt; ++p) {
                g[p] = f[r + p * w] - 1LL * p * v;
            }
            int head = 0, tail = 0;        // [head, tail)
            for (int p = 0; p <= cnt; ++p) {
                // 弹出窗口左端滑出的
                while (head < tail && q[head] < p - m) ++head;
                // 维护单调递减
                while (head < tail && g[q[tail - 1]] <= g[p]) --tail;
                q[tail++] = p;
                f[r + p * w] = g[q[head]] + 1LL * p * v;
            }
        }
    }
    cout << f[C] << endl;
    return 0;
}
