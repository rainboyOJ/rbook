#include <bits/stdc++.h>
#include <cassert>
using namespace std;

typedef long long ll;

const int maxq = 100000;
const int maxnode = maxq * 32 + 5;
const ll minx = -1000000000LL, maxx = 1000000000LL;
int root, tot, lc[maxnode], rc[maxnode];
ll tr[maxnode];

int new_node() {
    assert(tot + 1 < maxnode);
    return ++tot;
}

void add(int &p, ll l, ll r, ll pos, ll v) {
    if (!p) p = new_node();
    tr[p] += v;
    if (l == r) return;
    ll mid = l + (r - l) / 2;
    if (pos <= mid) add(lc[p], l, mid, pos, v);
    else add(rc[p], mid + 1, r, pos, v);
}

ll query(int p, ll l, ll r, ll L, ll R) {
    if (!p || r < L || R < l) return 0;
    if (L <= l && r <= R) return tr[p];
    ll mid = l + (r - l) / 2;
    return query(lc[p], l, mid, L, R) + query(rc[p], mid + 1, r, L, R);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    while (q--) {
        int op;
        ll x, y;
        cin >> op >> x >> y;
        if (op == 1) add(root, minx, maxx, x, y);
        else cout << query(root, minx, maxx, x, y) << '\n';
    }
    return 0;
}
