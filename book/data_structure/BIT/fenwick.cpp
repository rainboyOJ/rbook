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

long long range_sum(int l, int r) {
    return sum(r) - sum(l - 1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) {
        long long v;
        cin >> v;
        add(i, v);
    }
    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int p;
            long long v;
            cin >> p >> v;
            add(p, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << range_sum(l, r) << '\n';
        }
    }
    return 0;
}
