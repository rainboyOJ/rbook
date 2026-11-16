#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 200000 + 5;
int n, m;
ll a[maxn], tr[maxn * 4];

void pushup(int p) {
    tr[p] = min(tr[ls(p)], tr[rs(p)]);
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

void assign_point(int p, int l, int r, int pos, ll v) {
    if (l == r) {
        tr[p] = v;
        return;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) assign_point(ls(p), l, mid, pos, v);
    else assign_point(rs(p), mid + 1, r, pos, v);
    pushup(p);
}

int first_less(int p, int l, int r, int L, int R, ll x) {
    if (r < L || R < l || tr[p] >= x) return n + 1;
    if (l == r) return l;
    int mid = l + (r - l) / 2;
    int answer = first_less(ls(p), l, mid, L, R, x);
    if (answer != n + 1) return answer;
    return first_less(rs(p), mid + 1, r, L, R, x);
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
            assign_point(1, 1, n, pos, v);
        } else {
            int l, r;
            ll x;
            cin >> l >> r >> x;
            cout << first_less(1, 1, n, l, r, x) << '\n';
        }
    }
    return 0;
}
