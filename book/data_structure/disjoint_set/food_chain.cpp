#include <bits/stdc++.h>
using namespace std;

const int maxn = 50000 + 5;
int fa[maxn * 3], sz[maxn * 3];

void init(int count) {
    for (int i = 1; i <= count; ++i) {
        fa[i] = i;
        sz[i] = 1;
    }
}

int find(int x) {
    if (fa[x] == x) return x;
    return fa[x] = find(fa[x]);
}

bool same(int x, int y) {
    return find(x) == find(y);
}

void unite(int x, int y) {
    int fx = find(x), fy = find(y);
    if (fx == fy) return;
    if (sz[fx] < sz[fy]) swap(fx, fy);
    fa[fy] = fx;
    sz[fx] += sz[fy];
}

// x、x+n、x+2n 分别代表 x 自身、x 的猎物、x 的天敌的类别。
bool add_statement(int op, int x, int y, int n) {
    int shift = (op == 1 ? 0 : 2);  // 同类：x~y；x 吃 y：x~y+2n
    for (int k = 0; k < 3; ++k) {
        if (k != shift && same(x, y + k * n)) return false;
    }
    // 检查通过后再统一合并，不能把假话写入并查集。
    for (int k = 0; k < 3; ++k) {
        unite(x + k * n, y + (k + shift) % 3 * n);
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    init(3 * n);
    int answer = 0;
    while (m--) {
        int op;
        long long x, y;  // 题目允许越界编号，先用宽类型读取再验证
        cin >> op >> x >> y;
        if (x < 1 || x > n || y < 1 || y > n) {
            ++answer;
            continue;
        }
        if (!add_statement(op, (int)x, (int)y, n)) ++answer;
    }
    cout << answer << '\n';
    return 0;
}
