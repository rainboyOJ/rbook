#include <bits/stdc++.h>
using namespace std;

const int MAXN = 1000005;

struct Segment {
    int l;
    int r;
};

int n;
Segment seg[MAXN]; // 每个比赛的开始时间和结束时间

bool cmp_segment(const Segment &a, const Segment &b) {
    if (a.r != b.r) {
        return a.r < b.r;
    }
    return a.l < b.l;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    for (int i = 1; i <= n; i++) {
        cin >> seg[i].l >> seg[i].r;
    }

    sort(seg + 1, seg + n + 1, cmp_segment);

    int ans = 0;
    int last_end = 0; // 上一个已选比赛的结束时间
    for (int i = 1; i <= n; i++) {
        // 当前比赛开始时间不早于 last_end，就可以接在已选比赛后面。
        if (seg[i].l >= last_end) {
            ans++;
            last_end = seg[i].r;
        }
    }

    cout << ans << '\n';
    return 0;
}
