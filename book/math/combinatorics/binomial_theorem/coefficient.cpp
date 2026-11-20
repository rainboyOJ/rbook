#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 1000 + 5;
const int mod = 10007;
int c[maxn][maxn];

ll qpow(ll a, int b) {
    a = (a % mod + mod) % mod;
    ll answer = 1;  // 指数为 0 时返回 1，包括底数也为 0 的情形
    while (b) {
        if (b & 1) answer = answer * a % mod;
        a = a * a % mod;
        b >>= 1;
    }
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    ll a, b;
    int k, n, m;
    cin >> a >> b >> k >> n >> m;
    if (n + m != k) {  // 展开式中每一项的总次数都为 k
        cout << 0 << '\n';
        return 0;
    }

    c[0][0] = 1;
    for (int i = 1; i <= k; ++i) {
        c[i][0] = c[i][i] = 1;
        for (int j = 1; j < i; ++j) {
            c[i][j] = (c[i - 1][j - 1] + c[i - 1][j]) % mod;
        }
    }
    ll answer = 1LL * c[k][n] * qpow(a, n) % mod;
    answer = answer * qpow(b, m) % mod;
    cout << answer << '\n';
    return 0;
}
