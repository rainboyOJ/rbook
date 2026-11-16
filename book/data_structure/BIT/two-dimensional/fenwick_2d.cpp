#include <bits/stdc++.h>
using namespace std;

const int maxn = 1000 + 5;
const int maxm = 1000 + 5;
int n, m, q;
long long c[maxn][maxm];

int lowbit(int x) { return x & -x; }

void add(int x, int y, long long v) {
    for (int i = x; i <= n; i += lowbit(i)) {
        for (int j = y; j <= m; j += lowbit(j)) {
            c[i][j] += v;
        }
    }
}

long long sum(int x, int y) {
    long long res = 0;
    for (int i = x; i > 0; i -= lowbit(i)) {
        for (int j = y; j > 0; j -= lowbit(j)) {
            res += c[i][j];
        }
    }
    return res;
}

long long rect_sum(int x1, int y1, int x2, int y2) {
    return sum(x2, y2) - sum(x1 - 1, y2)
         - sum(x2, y1 - 1) + sum(x1 - 1, y1 - 1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m >> q;
    while (q--) {
        int op;
        cin >> op;
        if (op == 1) {
            int x, y;
            long long v;
            cin >> x >> y >> v;
            add(x, y, v);
        } else {
            int x1, y1, x2, y2;
            cin >> x1 >> y1 >> x2 >> y2;
            cout << rect_sum(x1, y1, x2, y2) << '\n';
        }
    }
    return 0;
}
