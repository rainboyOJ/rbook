#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
int n, m, base;
long long tr[maxn * 4];

void add(int pos, long long v) {
    int p = base + pos;
    tr[p] += v;
    for (p /= 2; p; p /= 2) tr[p] = tr[p * 2] + tr[p * 2 + 1];
}

long long query(int l, int r) {
    int L = base + l - 1, R = base + r + 1;
    long long answer = 0;
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
    for (int p = base - 1; p >= 1; --p) tr[p] = tr[p * 2] + tr[p * 2 + 1];
    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int pos;
            long long v;
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
