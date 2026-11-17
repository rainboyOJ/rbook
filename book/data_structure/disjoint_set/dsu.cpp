#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
int fa[maxn], sz[maxn];  // fa 存父亲；sz 只在根上表示集合大小

void init(int n) {
    for (int i = 1; i <= n; ++i) {
        fa[i] = i;
        sz[i] = 1;
    }
}

// 找到代表元，回溯时让沿途节点直接指向根。
int find(int x) {
    if (fa[x] == x) return x;
    fa[x] = find(fa[x]);
    return fa[x];
}

bool same(int x, int y) {
    return find(x) == find(y);
}

// 小集合的根接到大集合的根；返回是否真正合并。
bool unite(int x, int y) {
    int fx = find(x), fy = find(y);
    if (fx == fy) return false;  // 防止重复累加集合大小
    if (sz[fx] < sz[fy]) swap(fx, fy);
    fa[fy] = fx;
    sz[fx] += sz[fy];
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    init(n);

    while (m--) {
        int op, x, y;
        cin >> op >> x >> y;
        if (op == 1) unite(x, y);
        else cout << (same(x, y) ? "Y" : "N") << '\n';
    }
    return 0;
}
