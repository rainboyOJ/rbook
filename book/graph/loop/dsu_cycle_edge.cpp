#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
int n, m, fa[maxn], sz[maxn];

int find(int x) {
    if (fa[x] == x) return x;
    return fa[x] = find(fa[x]);
}

bool unite(int x, int y) {
    int fx = find(x), fy = find(y);
    if (fx == fy) return false;
    if (sz[fx] < sz[fy]) swap(fx, fy);
    fa[fy] = fx;
    sz[fx] += sz[fy];
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> m)) return 0;
    for (int u = 1; u <= n; ++u) {
        fa[u] = u;
        sz[u] = 1;
    }

    int answer = 0, from = 0, to = 0;
    for (int id = 1; id <= m; ++id) {
        int u, v;
        cin >> u >> v;
        if (!unite(u, v) && answer == 0) {
            // 两端已经连通，记录第一条使合并失败的原图边。
            answer = id;
            from = u;
            to = v;
        }
    }

    if (answer == 0) cout << 0 << '\n';
    else cout << answer << ' ' << from << ' ' << to << '\n';
    return 0;
}
