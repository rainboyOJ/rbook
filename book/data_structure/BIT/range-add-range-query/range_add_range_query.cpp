#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
int n, m;
long long c1[maxn], c2[maxn];

int lowbit(int x) { return x & -x; }

void add(long long c[], int p, long long v) {
    for (int i = p; i <= n; i += lowbit(i)) c[i] += v;
}

long long sum(const long long c[], int x) {
    long long res = 0;
    for (int i = x; i > 0; i -= lowbit(i)) res += c[i];
    return res;
}

void change(int p, long long v) {
    add(c1, p, v);
    add(c2, p, p * v);
}

void range_add(int l, int r, long long v) {
    change(l, v);
    if (r < n) change(r + 1, -v);
}

long long prefix_sum(int x) {
    return (x + 1LL) * sum(c1, x) - sum(c2, x);
}

long long range_sum(int l, int r) {
    return prefix_sum(r) - prefix_sum(l - 1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    long long previous = 0;
    for (int i = 1; i <= n; ++i) {
        long long value;
        cin >> value;
        change(i, value - previous);
        previous = value;
    }
    while (m--) {
        int op, l, r;
        cin >> op >> l >> r;
        if (op == 1) {
            long long v;
            cin >> v;
            range_add(l, r, v);
        } else {
            cout << range_sum(l, r) << '\n';
        }
    }
    return 0;
}
