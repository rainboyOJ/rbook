#include <iostream>
using namespace std;

const int maxn = 1e5 + 5;
int a[maxn];
int n, m;

// 模型 A：寻找第一个 >= val 的位置（最左解 / 最小值模型）
// 在闭区间 [l, r] 上搜索，未找到返回 -1
int bs_find_first_ge(int l, int r, int val) {
    int ans = -1; // 记账变量：初始为 -1 表示未找到

    while (l <= r) {
        int mid = (l + r) / 2;
        if (a[mid] >= val) {
            ans = mid;     // mid 满足要求，立即记账！
            r = mid - 1;   // 贪心向左缩小范围，寻找更靠前的解
        } else {
            l = mid + 1;   // mid 及左侧均过小，向右半区间搜索
        }
    }

    return ans; // 退出时 ans 必为最靠左的合法位置
}

// 模型 B：寻找最后一个 <= val 的位置（最右解 / 最大值模型，二分答案常用）
// 在闭区间 [l, r] 上搜索，未找到返回 -1
int bs_find_last_le(int l, int r, int val) {
    int ans = -1;

    while (l <= r) {
        int mid = (l + r) / 2;
        if (a[mid] <= val) {
            ans = mid;     // mid 满足要求，立即记账！
            l = mid + 1;   // 贪心向右扩大范围，寻找更靠后的解
        } else {
            r = mid - 1;   // mid 及右侧均过大，向左半区间搜索
        }
    }

    return ans; // 退出时 ans 必为最靠右的合法位置
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    for (int i = 1; i <= n; i++) {
        cin >> a[i];
    }

    for (int i = 1; i <= m; i++) {
        int num;
        cin >> num;
        int pos = bs_find_first_ge(1, n, num);
        if (pos == -1) {
            cout << "not found\n";
        } else {
            cout << a[pos] << " " << pos << "\n";
        }
    }

    return 0;
}
