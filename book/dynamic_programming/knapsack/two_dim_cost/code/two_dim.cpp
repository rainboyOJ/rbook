// 二维费用背包：每件物品消耗两种费用 a、b，两个上限分别 A、B
// f[i][j] = 两种费用分别花 i、j 时的最大价值；两维都倒序，保证每件只用一次
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;

int n, A, B;
int f[maxn][maxn];

int main() {
    cin >> n >> A >> B;
    for (int i = 1; i <= n; ++i) {
        int a, b, v;
        cin >> a >> b >> v;
        for (int j = A; j >= a; --j) {          // 第一维倒序
            for (int k = B; k >= b; --k) {      // 第二维倒序
                f[j][k] = max(f[j][k], f[j - a][k - b] + v);
            }
        }
    }
    cout << f[A][B] << endl;
    return 0;
}
