#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 200000 + 5;

vector<int> g[maxn];
int fa[maxn], order[maxn], sz[maxn];
ll down[maxn], ans[maxn];

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

    // 第一遍：孩子先于父亲，统计子树大小与子树内部距离和。
    for (int i = total; i >= 1; --i) {
        int u = order[i];
        sz[u] = 1;
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            sz[u] += sz[v];
            down[u] += down[v] + sz[v];  // 孩子子树中每个点都要多走一条边
        }
    }

    ans[1] = down[1];
    // 第二遍：父亲先于孩子，沿父子边推导全树答案。
    for (int i = 2; i <= total; ++i) {
        int v = order[i], u = fa[v];
        ans[v] = ans[u] + n - 2LL * sz[v];
    }

    for (int u = 1; u <= n; ++u) {
        cout << ans[u] << (u == n ? '\n' : ' ');
    }
    return 0;
}
