#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
int n, m;
long long a[maxn], b[maxn];
int c[maxn]; // 离散值域上的频次和

int lowbit(int x) { return x & -x; }

void add(int p, int v) {
    for (int i = p; i <= m; i += lowbit(i)) c[i] += v;
}

int sum(int x) {
    int res = 0;
    for (int i = x; i > 0; i -= lowbit(i)) res += c[i];
    return res;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n;
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        b[i] = a[i];
    }
    sort(b + 1, b + n + 1);
    m = int(unique(b + 1, b + n + 1) - b - 1);

    long long answer = 0;
    for (int j = 1; j <= n; ++j) {
        int rank = int(lower_bound(b + 1, b + m + 1, a[j]) - b);
        answer += (j - 1LL) - sum(rank);
        add(rank, 1);
    }
    cout << answer << '\n';
    return 0;
}
