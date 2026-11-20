#include <iostream>
#include <vector>
using namespace std;

vector<vector<int>> precompute_factors(int n) {
    vector<vector<int>> factors(n + 1);
    for (int d = 1; d <= n; d++) {
        // 使用 long long 防止 j += d 时发生 int 溢出。
        for (long long j = d; j <= n; j += d) {
            factors[j].push_back(d);
        }
    }
    return factors;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    if (!(cin >> n >> q)) return 0;
    vector<vector<int>> factors = precompute_factors(n);
    for (int i = 0; i < q; i++) {
        int x;
        cin >> x;
        for (int j = 0; j < (int)factors[x].size(); j++) {
            if (j > 0) cout << ' ';
            cout << factors[x][j];
        }
        cout << '\n';
    }
    return 0;
}
