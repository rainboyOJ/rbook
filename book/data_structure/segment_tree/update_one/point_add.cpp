#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
int n, m;
long long a[maxn], tr[maxn * 4];

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

void add(int p, int l, int r, int pos, long long v) {
    if (l == r) {
        tr[p] += v;
        return;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) add(p * 2, l, mid, pos, v);
    else add(p * 2 + 1, mid + 1, r, pos, v);
    pushup(p);
}

long long query(int p, int l, int r, int L, int R) {
    if (L <= l && r <= R) return tr[p];
    int mid = l + (r - l) / 2;
    long long answer = 0;
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
            int pos;
            long long v;
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
