#include <iostream>
#include <algorithm>

using namespace std;

const int maxn = 1e5 + 5;

int n;       // 原数组元素个数
int m;       // 离散化后不同元素的个数
int a[maxn]; // 原数组
int b[maxn]; // 辅助数组（排序去重后的有序字典）

// 对原数组 a[1..n] 执行离散化，并直接将 a 替换为 1-based 连续排名 [1, m]
void discrete() {
    // 1. 复制原数组到 b
    for (int i = 1; i <= n; i++) {
        b[i] = a[i];
    }

    // 2. 排序
    sort(b + 1, b + 1 + n);

    // 3. 原生去重（也可用 m = unique(b + 1, b + 1 + n) - (b + 1)）
    m = 0;
    for (int i = 1; i <= n; i++) {
        if (i == 1 || b[i] != b[i - 1]) {
            b[++m] = b[i];
        }
    }

    // 4. 二分查表替换原数组
    for (int i = 1; i <= n; i++) {
        a[i] = lower_bound(b + 1, b + 1 + m, a[i]) - b;
    }
}

// 供单独查询原数值 x 对应排名，未找到返回 0
int query(int x) {
    int idx = lower_bound(b + 1, b + 1 + m, x) - b;
    if (idx <= m && b[idx] == x) return idx;
    return 0;
}

int main() {
    n = 5;
    int raw[] = {0, 1000000000, 25, 1000000000, 4, 25};
    for (int i = 1; i <= n; i++) a[i] = raw[i];

    discrete();

    // 输出: 3 2 3 1 2
    for (int i = 1; i <= n; i++) {
        cout << a[i] << " ";
    }
    cout << "\n";

    return 0;
}
