#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long S;
    cin >> n >> S;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; ++i) cin >> a[i];

    int l = 1, ans = n + 1;
    long long sum = 0;
    for (int r = 1; r <= n; ++r) {
        sum += a[r];
        while (l <= r && sum >= S) {
            ans = min(ans, r - l + 1);
            sum -= a[l];
            ++l;
        }
    }
    cout << (ans == n + 1 ? 0 : ans) << '\n';
    return 0;
}
