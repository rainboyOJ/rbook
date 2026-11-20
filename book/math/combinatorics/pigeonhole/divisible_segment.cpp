#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 200000 + 5;
int first[maxn];  // first[r]：余数 r 首次出现的前缀位置

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    fill(first, first + n, -1);
    first[0] = 0;  // 空前缀 P[0]=0 也必须参与分类

    int rem = 0;
    for (int i = 1; i <= n; ++i) {
        ll x;
        cin >> x;
        // 只维护前缀和的余数；统一到 0..n-1，兼容负数。
        rem = (rem + x % n + n) % n;
        if (first[rem] != -1) {
            cout << first[rem] + 1 << ' ' << i << '\n';
            return 0;  // 两个不同位置的同余前缀，给出非空区间
        }
        first[rem] = i;
    }
    return 0;
}
