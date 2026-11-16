#include <bits/stdc++.h>
#include <cassert>
using namespace std;

typedef long long ll;

const int maxn = 200000 + 5;
const int maxnode = maxn * 20;
int n, m, kinds, tot;
ll a[maxn], values[maxn];
int root[maxn], lc[maxnode], rc[maxnode], cnt[maxnode];

int insert(int old, int l, int r, int pos) {
    assert(tot + 1 < maxnode);
    int p = ++tot;
    lc[p] = lc[old];
    rc[p] = rc[old];
    cnt[p] = cnt[old] + 1;
    if (l == r) return p;
    int mid = l + (r - l) / 2;
    if (pos <= mid) lc[p] = insert(lc[old], l, mid, pos);
    else rc[p] = insert(rc[old], mid + 1, r, pos);
    return p;
}

int kth(int before, int now, int l, int r, int k) {
    if (l == r) return l;
    int mid = l + (r - l) / 2;
    int left_count = cnt[lc[now]] - cnt[lc[before]];
    if (k <= left_count) return kth(lc[before], lc[now], l, mid, k);
    return kth(rc[before], rc[now], mid + 1, r, k - left_count);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        values[i] = a[i];
    }
    sort(values + 1, values + n + 1);
    kinds = int(unique(values + 1, values + n + 1) - values - 1);
    for (int i = 1; i <= n; ++i) {
        int pos = int(lower_bound(values + 1, values + kinds + 1, a[i]) - values);
        root[i] = insert(root[i - 1], 1, kinds, pos);
    }
    while (m--) {
        int l, r, k;
        cin >> l >> r >> k;
        int id = kth(root[l - 1], root[r], 1, kinds, k);
        cout << values[id] << '\n';
    }
    return 0;
}
