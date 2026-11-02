/**
 * Author by {{author}} blog: {{blog}} github : {{github}}
 * rbook: -> https://rbook.roj.ac.cn  https://rbook2.roj.ac.cn
 * date: {{date}}
 */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef unsigned long long ull;

const int maxn = 2e6 + 5;
int n, m;
int a[maxn];
int b[maxn];

int main() {
    std::cin >> n;
    for (int i = 1; i <= n; ++i)
        std::cin >> a[i];

    // 计算贡献,时间 n^2
    for (int i = 1; i <= n; ++i) {
        for (int j = i; j <= n; ++j) {
            // 注意自己对自己也有贡献
            // 因为 b[i] 初始为0
            b[i] += a[i];
        }
    }

    // 输出
    for (int i = 1; i <= n; ++i) {
        std::cout << b[i] << " ";
    }
    std::cout << "\n";

    return 0;
}
