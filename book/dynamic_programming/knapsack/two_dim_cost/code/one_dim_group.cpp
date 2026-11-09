// 「件数」当成第二种费用：最多选 K 件，容量 C
// f[cnt][j] = 选 cnt 件、容量 j 时的最大价值，两维都倒序
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, C, K;
int f[maxn][maxn];

int main() {
    cin >> n >> C >> K;
    for (int i = 1; i <= n; ++i) {
        int w, v;
        cin >> w >> v;
        for (int cnt = K; cnt >= 1; --cnt) {    // 件数倒序
            for (int j = C; j >= w; --j) {      // 容量倒序
                f[cnt][j] = max(f[cnt][j], f[cnt - 1][j - w] + v);
            }
        }
    }
    cout << f[K][C] << endl;
    return 0;
}
