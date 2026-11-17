#include <bits/stdc++.h>
using namespace std;

const int maxn = 30000 + 5;
int fa[maxn], sz[maxn], d[maxn];

void init() {
    for (int i = 1; i <= 30000; ++i) {
        fa[i] = i;
        sz[i] = 1;
        d[i] = 0;
    }
}

// 两遍路径压缩，避免固定合并方向形成深链后递归栈过深。
int find(int x) {
    int root = x, total = 0;
    while (fa[root] != root) {
        total += d[root];
        root = fa[root];
    }
    while (x != root) {
        int p = fa[x], old = d[x];
        fa[x] = root;
        d[x] = total;  // 当前节点到队首的距离
        total -= old;  // 下一节点原本到根的距离
        x = p;
    }
    return root;
}

// 把 x 所在队列整体接到 y 所在队列尾部，根始终表示队首。
void append(int x, int y) {
    int fx = find(x), fy = find(y);
    if (fx == fy) return;
    fa[fx] = fy;
    d[fx] = sz[fy];     // x 队列的旧队首向后平移 y 队列的长度
    sz[fy] += sz[fx];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    init();
    int m;
    cin >> m;
    while (m--) {
        char op;
        int x, y;
        cin >> op >> x >> y;
        if (op == 'M') append(x, y);
        else {
            int fx = find(x), fy = find(y);
            if (fx != fy) cout << -1 << '\n';
            else cout << abs(d[x] - d[y]) - 1 << '\n';  // 原题保证 x != y
        }
    }
    return 0;
}
