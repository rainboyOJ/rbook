#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 500000 + 5;
int n, m, base;
ll tr[maxn * 4];

void add(int pos, ll v) {
    int p = base + pos;
    tr[p] += v;
    for (p /= 2; p; p /= 2) tr[p] = tr[ls(p)] + tr[rs(p)];
}

ll query(int l, int r) {
    int L = base + l - 1, R = base + r + 1;
    ll answer = 0;
    while (L / 2 != R / 2) {
        if (L % 2 == 0) answer += tr[L + 1];
        if (R % 2 == 1) answer += tr[R - 1];
        L /= 2;
        R /= 2;
    }
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    base = 1;
    while (base < n + 2) base *= 2;
    for (int i = 1; i <= n; ++i) cin >> tr[base + i];
    for (int p = base - 1; p >= 1; --p) tr[p] = tr[ls(p)] + tr[rs(p)];
    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int pos;
            ll v;
            cin >> pos >> v;
            add(pos, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << query(l, r) << '\n';
        }
    }
    return 0;
}
