#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
int fa[maxn * 2], sz[maxn * 2];

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

// op=0 要求同类，op=1 要求异类；矛盾时拒绝这条关系。
bool add_relation(int op, int x, int y, int n) {
    if (op == 0) {
        if (same(x, y + n)) return false;
        unite(x, y);
        unite(x + n, y + n);
    } else {
        if (same(x, y)) return false;
        unite(x, y + n);
        unite(x + n, y);
    }
    return true;  // 相容的重复关系也返回 true
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    init(2 * n);  // x 表示自身身份，x+n 表示相反身份
    while (m--) {
        int op, x, y;
        cin >> op >> x >> y;
        cout << (add_relation(op, x, y, n) ? "YES" : "NO") << '\n';
    }
    return 0;
}
