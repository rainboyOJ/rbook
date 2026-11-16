#include <bits/stdc++.h>
#include <cassert>
using namespace std;

const int maxn = 1000000 + 5;
const int maxnode = maxn * 23;
int n, m, tot;
int a[maxn], root[maxn];
int lc[maxnode], rc[maxnode], value[maxnode];

int new_node() {
    assert(tot + 1 < maxnode);
    return ++tot;
}

int build(int l, int r) {
    int p = new_node();
    if (l == r) {
        value[p] = a[l];
        return p;
    }
    int mid = l + (r - l) / 2;
    lc[p] = build(l, mid);
    rc[p] = build(mid + 1, r);
    return p;
}

int modify(int old, int l, int r, int pos, int v) {
    int p = new_node();
    lc[p] = lc[old];
    rc[p] = rc[old];
    value[p] = value[old];
    if (l == r) {
        value[p] = v;
        return p;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) lc[p] = modify(lc[old], l, mid, pos, v);
    else rc[p] = modify(rc[old], mid + 1, r, pos, v);
    return p;
}

int query(int p, int l, int r, int pos) {
    if (l == r) return value[p];
    int mid = l + (r - l) / 2;
    if (pos <= mid) return query(lc[p], l, mid, pos);
    return query(rc[p], mid + 1, r, pos);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    root[0] = build(1, n);
    for (int i = 1; i <= m; ++i) {
        int v, op, pos;
        cin >> v >> op >> pos;
        if (op == 1) {
            int x;
            cin >> x;
            root[i] = modify(root[v], 1, n, pos, x);
        } else {
            cout << query(root[v], 1, n, pos) << '\n';
            root[i] = root[v];
        }
    }
    return 0;
}
