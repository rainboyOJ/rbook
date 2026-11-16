#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

const int maxn = 200000 + 5;
int n, m;
ll a[maxn], tr[maxn * 4];

void pushup(int p) {
    tr[p] = min(tr[p * 2], tr[p * 2 + 1]);
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

void assign_point(int p, int l, int r, int pos, ll v) {
    if (l == r) {
        tr[p] = v;
        return;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) assign_point(p * 2, l, mid, pos, v);
    else assign_point(p * 2 + 1, mid + 1, r, pos, v);
    pushup(p);
}

int first_less(int p, int l, int r, int L, int R, ll x) {
    if (r < L || R < l || tr[p] >= x) return n + 1;
    if (l == r) return l;
    int mid = l + (r - l) / 2;
    int answer = first_less(p * 2, l, mid, L, R, x);
    if (answer != n + 1) return answer;
    return first_less(p * 2 + 1, mid + 1, r, L, R, x);
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
