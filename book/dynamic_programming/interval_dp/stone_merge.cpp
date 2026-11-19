#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 305;
const ll INF = 1LL << 60;
int n;
ll a[maxn], sum[maxn], f[maxn][maxn];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        sum[i] = sum[i - 1] + a[i];
    }

    // 全局数组初值为 0，f[i][i] = 0：单独一堆不需要合并。
    for (int len = 2; len <= n; ++len) {
        for (int l = 1; l + len - 1 <= n; ++l) {
            int r = l + len - 1;
            f[l][r] = INF;
            ll cost = sum[r] - sum[l - 1];  // 最后一次合并的代价
            for (int k = l; k < r; ++k) {
                // [l,k] 和 [k+1,r] 先各自合成一堆，再合并这两堆。
                f[l][r] = min(f[l][r], f[l][k] + f[k + 1][r] + cost);
            }
        }
    }

    cout << f[1][n] << '\n';
    return 0;
}
