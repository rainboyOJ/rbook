// brute.cpp —— 暴力（标准答案）: 01 序列, 二进制枚举每场比赛选(1) / 不选(0)
// 对拍时必须保证它正确, 宁慢勿错.
#include <bits/stdc++.h>
using namespace std;

int n;
int ans = 0;
int L[20], R[20]; // L[i] / R[i]: 第 i 场比赛的开始 / 结束时间

// 判断 mask 这种选择方案是否合法: 任意两场被选中的比赛都不能冲突
bool check(int mask) {
    for (int i = 0; i < n; i++) {
        if (((mask >> i) & 1) == 0) continue;
        for (int j = i + 1; j < n; j++) {
            if (((mask >> j) & 1) == 0) continue;
            // 区间 [L[i], R[i]] 与 [L[j], R[j]] 有重叠就不能同时选
            // 注意: 只有 start < 上一场 end 才算冲突, 首尾相接是可以的
            if (L[i] < R[j] && L[j] < R[i]) return false;
        }
    }
    return true;
}

int main() {
    cin >> n;
    for (int i = 0; i < n; i++) {
        cin >> L[i] >> R[i];
    }

    // 01 序列: 第 i 位为 1 表示参加第 i 场比赛
    for (int mask = 0; mask < (1 << n); mask++) {
        if (!check(mask)) continue;

        int cnt = 0;
        for (int i = 0; i < n; i++) {
            if ((mask >> i) & 1) cnt++;
        }
        ans = max(ans, cnt);
    }

    cout << ans << '\n';
    return 0;
}
