#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 500000 + 5;
int n, m;
ll a[maxn], tr[maxn * 4];

void pushup(int p) {
    tr[p] = tr[ls(p)] + tr[rs(p)];
}

void build(int p, int l, int r) {
    if (l == r) {
        tr[p] = a[l];
        return;
    }
    int mid = l + (r - l) / 2;
    build(ls(p), l, mid);
    build(rs(p), mid + 1, r);
    pushup(p);
}

void add(int p, int l, int r, int pos, ll v) {
    if (l == r) {
        tr[p] += v;
        return;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) add(ls(p), l, mid, pos, v);
    else add(rs(p), mid + 1, r, pos, v);
    pushup(p);
}

ll query(int p, int l, int r, int L, int R) {
    if (L <= l && r <= R) return tr[p];
    int mid = l + (r - l) / 2;
    ll answer = 0;
    if (L <= mid) answer += query(ls(p), l, mid, L, R);
    if (R > mid) answer += query(rs(p), mid + 1, r, L, R);
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
            int pos;
            ll v;
            cin >> pos >> v;
            add(1, 1, n, pos, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << query(1, 1, n, l, r) << '\n';
        }
    }
    return 0;
}
