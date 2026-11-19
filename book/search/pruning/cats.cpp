#include <bits/stdc++.h>
using namespace std;

const int maxn = 20;  // n <= 18
int n, capacity, w[maxn], load[maxn], best;

// 安排第 u 只猫，已有 used 辆车；load[i] 是第 i 辆车的当前载重。
void dfs(int u, int used) {
    if (used >= best) return;  // 车数不会减少，已经无法改进最优值
    if (u > n) {
        best = min(best, used);
        return;
    }

    for (int i = 1; i <= used; ++i) {
        if (load[i] + w[u] > capacity) continue;  // 超载分支不可行

        bool same_load = false;
        for (int j = 1; j < i; ++j) {
            if (load[j] == load[i]) {
                same_load = true;
                break;
            }
        }
        if (same_load) continue;  // 同一层，相同载重的车只尝试一辆

        load[i] += w[u];
        dfs(u + 1, used);
        load[i] -= w[u];  // 恢复现场，再尝试其他车
    }

    // 未使用的空车没有区别，只开一辆编号为 used+1 的新车。
    load[used + 1] = w[u];
    dfs(u + 1, used + 1);
    load[used + 1] = 0;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> capacity)) return 0;
    for (int i = 1; i <= n; ++i) cin >> w[i];
    sort(w + 1, w + n + 1, greater<int>());  // 优先安排较重的猫
    best = n;  // 每只猫单独一车，是题目保证可行的初始上界
    dfs(1, 0);
    cout << best << '\n';
    return 0;
}
