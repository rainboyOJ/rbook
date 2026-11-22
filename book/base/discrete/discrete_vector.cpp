#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// 将 a 中的原值替换为从 1 开始的编号，返回不同数值的个数。
int discrete(vector<int> &a) {
    vector<int> b = a;

    sort(b.begin(), b.end());
    auto it = unique(b.begin(), b.end());
    int m = it - b.begin();  // 去重后的有效区间为 [b.begin(), it)

    for (int &x : a) {
        x = lower_bound(b.begin(), it, x) - b.begin() + 1;
    }
    return m;
}

int main() {
    vector<int> a = {1000000000, 25, 1000000000, 4, 25};
    int m = discrete(a);

    cout << "不同元素个数 m = " << m << "\n";
    // 输出: 3 2 3 1 2
    for (int x : a) {
        cout << x << " ";
    }
    cout << "\n";

    return 0;
}
