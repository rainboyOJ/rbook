#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

const int maxn = 100000 + 5;
struct Event {
    ll y, x1, x2;
    int delta;
};
int n, kinds, cover[maxn * 8];
ll xs[maxn * 2], len[maxn * 8];
Event events[maxn * 2];

void pushup(int p, int l, int r) {
    if (cover[p] > 0) len[p] = xs[r + 1] - xs[l];
    else if (l == r) len[p] = 0;
    else len[p] = len[p * 2] + len[p * 2 + 1];
}

void update(int p, int l, int r, int L, int R, int delta) {
    if (L <= l && r <= R) {
        cover[p] += delta;
        pushup(p, l, r);
        return;
    }
    int mid = l + (r - l) / 2;
    if (L <= mid) update(p * 2, l, mid, L, R, delta);
    if (R > mid) update(p * 2 + 1, mid + 1, r, L, R, delta);
    pushup(p, l, r);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    int count = 0;
    for (int i = 1; i <= n; ++i) {
        ll x1, y1, x2, y2;
        cin >> x1 >> y1 >> x2 >> y2;
        events[++count] = {y1, x1, x2, 1};
        xs[count] = x1;
        events[++count] = {y2, x1, x2, -1};
        xs[count] = x2;
    }
    sort(xs + 1, xs + count + 1);
    kinds = int(unique(xs + 1, xs + count + 1) - xs - 1);
    sort(events + 1, events + count + 1, [](const Event &a, const Event &b) {
        return a.y < b.y;
    });
    ll answer = 0, previous_y = events[1].y;
    int i = 1;
    while (i <= count) {
        ll y = events[i].y;
        answer += len[1] * (y - previous_y);
        while (i <= count && events[i].y == y) {
            int L = int(lower_bound(xs + 1, xs + kinds + 1, events[i].x1) - xs);
            int R = int(lower_bound(xs + 1, xs + kinds + 1, events[i].x2) - xs) - 1;
            update(1, 1, kinds - 1, L, R, events[i].delta);
            ++i;
        }
        previous_y = y;
    }
    cout << answer << '\n';
    return 0;
}
