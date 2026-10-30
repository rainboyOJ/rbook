// wrong_greedy.cpp —— 故意写错的贪心: 按开始时间排序
// 直觉: 开始得越早越应该参加. 这个直觉是错的, 用对拍找反例.
#include <bits/stdc++.h>
using namespace std;

int n;
int L[100], R[100]; // L[i] / R[i]: 第 i 场比赛的开始 / 结束时间
int id[100];        // 排序用的下标数组

// 按开始时间升序
bool cmp_start(int x, int y) {
    if (L[x] != L[y]) return L[x] < L[y];
    return R[x] < R[y];
}

int main() {
    cin >> n;
    for (int i = 0; i < n; i++) {
        cin >> L[i] >> R[i];
        id[i] = i;
    }

    // 错误策略: 开始时间最早的优先
    sort(id, id + n, cmp_start);

    int ans = 0;
    int last = INT_MIN;

    for (int i = 0; i < n; i++) {
        int k = id[i];
        if (L[k] >= last) {
            ans++;
            last = R[k];
        }
    }

    cout << ans << '\n';
    return 0;
}
