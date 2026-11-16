#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

const int maxn = 100000 + 5;
int n, m;
ll a[maxn], tr[maxn * 4], lazy[maxn * 4];

void pushup(int p) {
    tr[p] = tr[p * 2] + tr[p * 2 + 1];
}

void build(int p, int l, int r) {
    if (l == r) {
        tr[p] = a[l];
        return;
    }
    int mid = l + (r - l) / 2;
    build(p * 2, l, mid);
    build(p * 2 + 1, mid + 1, r);
    pushup(p);
}

void apply(int p, int l, int r, ll v) {
    tr[p] += v * (r - l + 1);
    lazy[p] += v;
}

void pushdown(int p, int l, int r) {
    if (lazy[p] == 0) return;
    int mid = l + (r - l) / 2;
    apply(p * 2, l, mid, lazy[p]);
    apply(p * 2 + 1, mid + 1, r, lazy[p]);
    lazy[p] = 0;
}

void add(int p, int l, int r, int L, int R, ll v) {
    if (L <= l && r <= R) {
        apply(p, l, r, v);
        return;
    }
    pushdown(p, l, r);
    int mid = l + (r - l) / 2;
    if (L <= mid) add(p * 2, l, mid, L, R, v);
    if (R > mid) add(p * 2 + 1, mid + 1, r, L, R, v);
    pushup(p);
}

ll query(int p, int l, int r, int L, int R) {
    if (L <= l && r <= R) return tr[p];
    pushdown(p, l, r);
    int mid = l + (r - l) / 2;
    ll answer = 0;
    if (L <= mid) answer += query(p * 2, l, mid, L, R);
    if (R > mid) answer += query(p * 2 + 1, mid + 1, r, L, R);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    build(1, 1, n);
    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int l, r;
            ll v;
            cin >> l >> r >> v;
            add(1, 1, n, l, r, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << query(1, 1, n, l, r) << '\n';
        }
    }
    return 0;
}
