// gen.cpp —— 随机数据生成器
// 生成 n 个短区间(允许重复), 规模控制在 n <= 8, 方便暴力 DFS 对拍
#include <bits/stdc++.h>
using namespace std;

random_device rd;
mt19937 rng(rd());

int rnd(int l, int r) {
    return rng() % (r - l + 1) + l;
}

int main() {
    int n = rnd(4, 8);
    cout << n << '\n';

    for (int i = 0; i < n; i++) {
        int l = rnd(1, 15);
        int r = rnd(l + 1, 20);
        cout << l << ' ' << r << '\n';
    }
    return 0;
}
