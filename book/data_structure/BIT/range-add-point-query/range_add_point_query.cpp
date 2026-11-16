#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
int n, m;
long long c[maxn];

int lowbit(int x) { return x & -x; }

void add(int p, long long v) {
    for (int i = p; i <= n; i += lowbit(i)) c[i] += v;
}

long long sum(int x) {
    long long res = 0;
    for (int i = x; i > 0; i -= lowbit(i)) res += c[i];
    return res;
}

void range_add(int l, int r, long long v) {
    add(l, v);
    if (r < n) add(r + 1, -v);
}

long long point_query(int x) { return sum(x); }

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    long long previous = 0;
    for (int i = 1; i <= n; ++i) {
        long long value;
        cin >> value;
        add(i, value - previous);
        previous = value;
    }
    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int l, r;
            long long v;
            cin >> l >> r >> v;
            range_add(l, r, v);
        } else {
            int x;
            cin >> x;
            cout << point_query(x) << '\n';
        }
    }
    return 0;
}
