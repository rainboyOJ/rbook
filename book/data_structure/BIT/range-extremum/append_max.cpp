#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5; // 按追加次数上限设置
int n;
long long a[maxn], c[maxn];

int lowbit(int x) { return x & -x; }

void append(long long v) {
    ++n;
    a[n] = c[n] = v;
    for (int step = 1; step < lowbit(n); step <<= 1) {
        c[n] = max(c[n], c[n - step]);
    }
}

long long range_max(int l, int r) {
    long long res = numeric_limits<long long>::lowest();
    while (l <= r) {
        if (r - lowbit(r) + 1 >= l) {
            res = max(res, c[r]);
            r -= lowbit(r);
        } else {
            res = max(res, a[r]);
            --r;
        }
    }
    return res;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m;
    long long mod, last = 0;
    cin >> m >> mod;
    while (m--) {
        char op;
        long long x;
        cin >> op >> x;
        if (op == 'A') {
            long long v = x % mod;
            if (v < 0) v += mod;
            append((v + last) % mod);
        } else {
            int length = int(x);
            last = range_max(n - length + 1, n);
            cout << last << '\n';
        }
    }
    return 0;
}
