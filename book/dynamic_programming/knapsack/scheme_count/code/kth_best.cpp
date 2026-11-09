// 01 背包的第 K 优解：每个状态维护一个大小为 K 的有序队列（从大到小）
// 转移 = 把「不选第 i 件」和「选第 i 件」两个有序队列归并，取前 K 个
// 复杂度 O(n C K)
//
// 约定：价值相同的不同方案算同一个解，所以归并时要去重。
// 若某容量下的不同解不足 K 个，输出其中最差的那个（即最后一个有效解）。
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;
const int NEG = -1e9;

int n, C, K;
int f[maxn][maxn];      // f[j][k]：容量 j 的第 k 优解（k 从 1 开始，1 最好）

int main() {
    cin >> n >> C >> K;

    // 初始：容量 j 只有「什么都不装」一种方案，价值 0
    for (int j = 0; j <= C; ++j) {
        f[j][1] = 0;
        for (int k = 2; k <= K; ++k) f[j][k] = NEG;
    }

    for (int i = 1; i <= n; ++i) {
        int w, v;
        cin >> w >> v;
        for (int j = C; j >= w; --j) {
            // A = 不选第 i 件（f[j] 本身），B = 选第 i 件（f[j-w] 全体 + v）
            int a = 1, b = 1;
            int tmp[maxn], cnt = 0, last = NEG;
            bool hasLast = false;
            while (cnt < K && (a <= K || b <= K)) {
                int va = (a <= K) ? f[j][a] : NEG;
                int vb = (b <= K && f[j - w][b] != NEG) ? f[j - w][b] + v : NEG;
                // 注意：NEG 加上 v 会变成「看起来合法」的数，必须先判空
                if (va == NEG && vb == NEG) break;
                int pick;
                if (va >= vb) { pick = va; ++a; }
                else { pick = vb; ++b; }
                if (hasLast && pick == last) continue;   // 去重：相同价值只留一个
                tmp[++cnt] = pick;
                last = pick; hasLast = true;
            }
            for (int k = 1; k <= cnt; ++k) f[j][k] = tmp[k];
            for (int k = cnt + 1; k <= K; ++k) f[j][k] = NEG;
        }
    }

    // 有效解个数：从头数到第一个 NEG
    int count = 0;
    for (int k = 1; k <= K; ++k) {
        if (f[C][k] == NEG) break;
        count = k;
    }
    int idx = min(K, count);                    // 不足 K 个就取最后一个有效解
    cout << f[C][1] << " " << f[C][idx] << endl;
    return 0;
}
