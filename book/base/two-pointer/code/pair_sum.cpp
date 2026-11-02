#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; ++i) cin >> a[i];
    long long m;
    cin >> m;
    sort(a.begin() + 1, a.end());

    int l = 1, r = n;
    while (l < r) {
        long long sum = 1LL * a[l] + a[r];
        if (sum == m) {
            cout << a[l] << ' ' << a[r] << '\n';
            return 0;
        }
        if (sum < m) ++l;  // a[l] 与最大的搭档相加仍不足
        else --r;         // a[r] 与最小的搭档相加已超出
    }
    // 本题保证有解；若取消保证，可以在这里输出无解标记。
    return 0;
}
