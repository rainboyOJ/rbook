#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
const long long NEG_INF = numeric_limits<long long>::lowest();
int n, m;
long long c[maxn];

int lowbit(int x) { return x & -x; }

void chmax(int p, long long v) {
    for (int i = p; i <= n; i += lowbit(i)) c[i] = max(c[i], v);
}

long long prefix_max(int r) {
    long long res = NEG_INF;
    for (int i = r; i > 0; i -= lowbit(i)) res = max(res, c[i]);
    return res;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    fill(c, c + n + 1, NEG_INF);
    for (int i = 1; i <= n; ++i) {
        long long v;
        cin >> v;
        chmax(i, v);
    }
    while (m--) {
        int op, x;
        cin >> op >> x;
        if (op == 1) {
            long long v;
            cin >> v;
            chmax(x, v);
        } else {
            cout << prefix_max(x) << '\n';
        }
    }
    return 0;
}
