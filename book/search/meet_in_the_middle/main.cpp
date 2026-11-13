#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int n;
long long m;
vector<long long> a;

// 枚举下标区间 [pos, end) 的所有选择；sum 始终是模 m 的余数。
void dfs(int pos, int end, long long sum, vector<long long>& result) {
    if (pos == end) {
        result.push_back(sum);
        return;
    }

    dfs(pos + 1, end, sum, result);
    dfs(pos + 1, end, (sum + a[pos]) % m, result);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    a.resize(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        a[i] %= m;
    }

    int mid = n / 2;
    vector<long long> left, right;
    left.reserve(1ULL << mid);
    right.reserve(1ULL << (n - mid));
    dfs(0, mid, 0, left);
    dfs(mid, n, 0, right);
    sort(right.begin(), right.end());

    long long ans = 0;
    for (long long u : left) {
        // 查找严格小于 m-u 的最大余数，确保相加后不回绕。
        auto it = lower_bound(right.begin(), right.end(), m - u);
        // 空集保证 right 含 0，而 m-u >= 1，所以前驱一定存在。
        --it;
        ans = max(ans, u + *it);
    }

    cout << ans << '\n';
    return 0;
}
