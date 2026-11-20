#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e6 + 5;
int n;
int a[maxn];

void quick_sort(int l, int r) {
    if (l >= r) return;

    // 随机选一个基准值，避免有序数据卡成 O(n^2)
    int key = a[l + rand() % (r - l + 1)];

    // [l, L-1] < key，[L, i-1] == key，[i, R] 待检查，[R+1, r] > key
    int L = l, R = r, i = l;
    while (i <= R) {
        if (a[i] < key) {
            swap(a[i++], a[L++]);  // 换来的是已知 == key 的数，i 可以前进
        } else if (a[i] > key) {
            swap(a[i], a[R--]);    // 从 R 换来的数尚未检查，i 留在原地
        } else {
            i++;
        }
    }

    // 中间 [L, R] 全部等于 key，无需再排，只递归两侧
    quick_sort(l, L - 1);
    quick_sort(R + 1, r);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    srand(time(nullptr));

    if (!(cin >> n)) return 0;
    for (int i = 1; i <= n; ++i) cin >> a[i];

    quick_sort(1, n);

    for (int i = 1; i <= n; ++i) {
        cout << a[i] << (i == n ? '\n' : ' ');
    }
    return 0;
}
