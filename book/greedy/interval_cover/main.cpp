#include <iostream>
#include <algorithm>
using namespace std;

typedef long long ll;

const int MAXN = 25000 + 5;

// 区间结构体：每头奶牛工作的起止时间段
struct Segment {
    ll l;
    ll r;
};

// 按左端点升序排序；若左端点相同则按右端点升序排序
bool cmp(const Segment &a, const Segment &b) {
    if (a.l != b.l) return a.l < b.l;
    return a.r < b.r;
}

ll n, t;
Segment seg[MAXN];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> t)) return 0;

    for (ll i = 0; i < n; i++) {
        cin >> seg[i].l >> seg[i].r;
    }

    sort(seg, seg + n, cmp);

    ll cur = 0; // 当前已经连续覆盖到时间点 cur
    ll ans = 0; // 选用的最少奶牛数量
    ll j = 0;   // 扫描区间的双指针

    while (cur < t) {
        ll best = cur; // 记录能覆盖 cur + 1 的所有候选区间中，最远的右端点
        while (j < n && seg[j].l <= cur + 1) {
            if (seg[j].r > best) {
                best = seg[j].r;
            }
            j++;
        }

        // 如果没有区间能接上当前缺口，说明无法完全覆盖
        if (best == cur) {
            cout << -1 << "\n";
            return 0;
        }

        cur = best;
        ans++;
    }

    cout << ans << "\n";
    return 0;
}
