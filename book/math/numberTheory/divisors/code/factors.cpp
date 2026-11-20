#include <iostream>
#include <vector>
using namespace std;

vector<long long> get_factors(long long n) {
    vector<long long> small, large;
    // d <= n / d 等价于 d * d <= n，但不会发生乘法溢出。
    for (long long d = 1; d <= n / d; d++) {
        if (n % d != 0) continue;
        small.push_back(d);
        long long other = n / d;
        if (d != other) large.push_back(other);
    }
    // 大约数原本递减，反向拼接后得到升序结果。
    for (int i = (int)large.size() - 1; i >= 0; i--) {
        small.push_back(large[i]);
    }
    return small;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long n;
    if (!(cin >> n)) return 0;
    vector<long long> factors = get_factors(n);
    for (int i = 0; i < (int)factors.size(); i++) {
        if (i > 0) cout << ' ';
        cout << factors[i];
    }
    cout << '\n';
    return 0;
}
