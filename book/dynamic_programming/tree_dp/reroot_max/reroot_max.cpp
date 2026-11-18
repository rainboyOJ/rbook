#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;

vector<int> g[maxn];
int fa[maxn], order[maxn];
int down[maxn], second[maxn], from[maxn], up[maxn], ans[maxn];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }

    order[1] = 1;
    int total = 1;
    for (int i = 1; i <= total; ++i) {
        int u = order[i];
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            fa[v] = u;
            order[++total] = v;
        }
    }

    // 第一遍：保存不同孩子提供的最大、次大贡献，允许两者数值相等。
    for (int i = total; i >= 1; --i) {
        int u = order[i];
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            int value = down[v] + 1;
            if (value > down[u]) {
                second[u] = down[u];
                down[u] = value;
                from[u] = v;
            } else if (value > second[u]) {
                second[u] = value;
            }
        }
    }

    // 第二遍：向孩子传递不经过它自身子树的最远距离。
    for (int i = 1; i <= total; ++i) {
        int u = order[i];
        ans[u] = max(down[u], up[u]);
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            int other = (from[u] == v ? second[u] : down[u]);
            up[v] = 1 + max(up[u], other);  // 先到 u，再向父亲方向或兄弟子树走
        }
    }

    for (int u = 1; u <= n; ++u) {
        cout << ans[u] << (u == n ? '\n' : ' ');
    }
    return 0;
}
