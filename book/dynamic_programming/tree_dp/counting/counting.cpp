#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 100000 + 5;
const ll mod = 1000000007;

vector<int> g[maxn];
int fa[maxn], order[maxn];
ll f[maxn][2];

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

    // 先记录一个父亲先于孩子的顺序，避免长链上的深层递归。
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

    // 倒序处理，保证孩子的方案数已经算好。
    for (int i = total; i >= 1; --i) {
        int u = order[i];
        f[u][0] = f[u][1] = 1;
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            f[u][0] = f[u][0] * ((f[v][0] + f[v][1]) % mod) % mod;
            f[u][1] = f[u][1] * f[v][0] % mod;
        }
    }

    cout << (f[1][0] + f[1][1]) % mod << '\n';
    return 0;
}
