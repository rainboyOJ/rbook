// 完整实现：读一棵 n 个点的树，输出两套编号、子树大小和深度，再回答祖孙询问。
// 输入：
//   n
//   n-1 行 u v（无向边）
//   q
//   q 行 u v（问 u 是不是 v 的祖先）
// 输出：先序、欧拉序、每个点的 in/out/size/dep，以及每次询问的 yes/no。
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5 + 5;

vector<int> tree[maxn];
int in_[maxn], out_[maxn], sz[maxn], dep[maxn], order_[maxn];
int euler[2 * maxn];
int timer, etot;

void dfs_order(int u, int fa) {
    in_[u] = ++timer;
    order_[timer] = u;
    sz[u] = 1;
    for (int v : tree[u]) {
        if (v == fa) continue;
        dep[v] = dep[u] + 1;
        dfs_order(v, u);
        sz[u] += sz[v];
    }
    out_[u] = timer;
}

void dfs_euler(int u, int fa) {
    euler[++etot] = u;
    for (int v : tree[u]) {
        if (v == fa) continue;
        dfs_euler(v, u);
        euler[++etot] = u;
    }
}

bool is_ancestor(int u, int v) {
    return in_[u] <= in_[v] && in_[v] <= out_[u];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 1; i <= n - 1; i++) {
        int u, v;
        cin >> u >> v;
        tree[u].push_back(v);
        tree[v].push_back(u);
    }

    dep[1] = 1;
    dfs_order(1, 0);
    dfs_euler(1, 0);

    cout << "order:";
    for (int i = 1; i <= n; i++) cout << ' ' << order_[i];
    cout << '\n';

    cout << "euler:";
    for (int i = 1; i <= etot; i++) cout << ' ' << euler[i];
    cout << '\n';

    for (int u = 1; u <= n; u++) {
        cout << u << ": in=" << in_[u] << " out=" << out_[u]
             << " size=" << sz[u] << " dep=" << dep[u] << '\n';
    }

    int q;
    cin >> q;
    while (q--) {
        int u, v;
        cin >> u >> v;
        bool ok = is_ancestor(u, v);
        cout << u << ' ' << v << ' ' << (ok ? "yes" : "no") << '\n';
    }
    return 0;
}
