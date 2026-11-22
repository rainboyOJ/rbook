#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // 原数组
    vector<int> a = {1000000000, 25, 1000000000, 4, 25};

    // 1. 拷贝到辅助数组 b
    vector<int> b = a;

    // 2. 排序与去重
    sort(b.begin(), b.end());
    b.erase(unique(b.begin(), b.end()), b.end());

    // b 的大小即为不同元素的个数 m
    int m = static_cast<int>(b.size());

    // 3. 查表映射：将原数组元素替换为 1-based 连续排名 [1, m]
    for (int &x : a) {
        x = lower_bound(b.begin(), b.end(), x) - b.begin() + 1;
    }

    cout << "不同元素个数 m = " << m << "\n";
    // 输出: 3 2 3 1 2
    for (int x : a) {
        cout << x << " ";
    }
    cout << "\n";

    return 0;
}
