#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
const int maxn = 200000 + 5;
int fa[maxn], sz[maxn];
ll d[maxn];  // d[x] = V[x] - V[fa[x]]；find(x) 后变为到根的差

void init(int n) {
    for (int i = 1; i <= n; ++i) {
        fa[i] = i;
        sz[i] = 1;
        d[i] = 0;
    }
}

int find(int x) {
    if (fa[x] == x) return x;
    int p = fa[x];          // 保存旧父亲
    int root = find(p);     // 先让 d[p] 变为 V[p] - V[root]
    d[x] += d[p];           // 两段相加，得到 V[x] - V[root]
    fa[x] = root;
    return root;
}

// 尝试加入 V[y] - V[x] = w；相容则接受，矛盾则拒绝。
bool add_relation(int x, int y, ll w) {
    int fx = find(x), fy = find(y);
    if (fx == fy) return d[y] - d[x] == w;

    ll delta = w + d[x] - d[y];  // V[fy] - V[fx]
    if (sz[fx] < sz[fy]) {
        swap(fx, fy);
        delta = -delta;         // 连接方向反转，差值也必须反号
    }
    fa[fy] = fx;
    d[fy] = delta;
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
        if (op == 0) {
            ll w;
            cin >> w;
            cout << (add_relation(x, y, w) ? "YES" : "NO") << '\n';
        } else {
            int fx = find(x), fy = find(y);
            if (fx != fy) cout << "UNKNOWN\n";
            else cout << d[y] - d[x] << '\n';
        }
    }
    return 0;
}
