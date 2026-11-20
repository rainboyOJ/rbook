#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 20 + 5;
ll d[maxn];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    d[0] = 1;  // 空排列只有一种，为递推和组合计数提供边界
    d[1] = 0;
    for (int i = 2; i <= n; ++i) {
        d[i] = (i - 1) * (d[i - 1] + d[i - 2]);
    }
    cout << d[n] << '\n';
    return 0;
}
