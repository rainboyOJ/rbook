#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
const int maxn = 100000 + 5;
const int maxm = 300000 + 5;

struct Edge {
    int u, v, id;
    ll w;
};

Edge e[maxm];
int fa[maxn], sz[maxn];

void init(int n) {
    for (int i = 1; i <= n; ++i) {
        fa[i] = i;
        sz[i] = 1;
    }
}

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

bool cmp(const Edge &a, const Edge &b) {
    if (a.w != b.w) return a.w < b.w;
    return a.id < b.id;  // 同权时按输入顺序，便于与正文示例核对
}

const int LOG = 18;  // 2^18 > 100000，下标 0..17
const ll NEG = -(1LL << 62);

struct TreeEdge {
    int to;
    ll w;
};

vector<TreeEdge> g[maxn];  // 保存选中的原图边，不是并查集父亲指针
int dep[maxn], up[maxn][LOG], que[maxn];
ll mx[maxn][LOG];          // 向上 2^j 步的路径最大边权

void build_forest(int n, int m) {
    init(n);
    for (int u = 1; u <= n; ++u) g[u].clear();
    sort(e, e + m, cmp);
    for (int i = 0; i < m; ++i) {
        if (!unite(e[i].u, e[i].v)) continue;
        g[e[i].u].push_back({e[i].v, e[i].w});
        g[e[i].v].push_back({e[i].u, e[i].w});
    }

    for (int u = 0; u <= n; ++u) {
        dep[u] = 0;
        for (int j = 0; j < LOG; ++j) {
            up[u][j] = 0;
            mx[u][j] = NEG;  // 空路径不能初始化为 0，否则负边权会出错
        }
    }
    // 原图可能不连通：对森林中的每棵树分别预处理。
    for (int root = 1; root <= n; ++root) {
        if (dep[root]) continue;
        int head = 0, tail = 0;
        que[tail++] = root;
        dep[root] = 1;
        while (head < tail) {
            int u = que[head++];
            for (auto [v, w] : g[u]) {
                if (v == up[u][0]) continue;
                dep[v] = dep[u] + 1;
                up[v][0] = u;
                mx[v][0] = w;
                for (int j = 1; j < LOG; ++j) {
                    int p = up[v][j - 1];
                    up[v][j] = up[p][j - 1];
                    mx[v][j] = max(mx[v][j - 1], mx[p][j - 1]);
                }
                que[tail++] = v;
            }
        }
    }
}

// 调用前确认两点连通。相同点按本模板的接口约定返回 0。
ll path_max(int u, int v) {
    if (u == v) return 0;
    ll answer = NEG;
    if (dep[u] < dep[v]) swap(u, v);
    int diff = dep[u] - dep[v];
    for (int j = LOG - 1; j >= 0; --j) {
        if (diff >> j & 1) {
            answer = max(answer, mx[u][j]);
            u = up[u][j];
        }
    }
    if (u == v) return answer;
    for (int j = LOG - 1; j >= 0; --j) {
        if (up[u][j] != up[v][j]) {
            answer = max(answer, max(mx[u][j], mx[v][j]));
            u = up[u][j];
            v = up[v][j];
        }
    }
    return max(answer, max(mx[u][0], mx[v][0]));
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int i = 0; i < m; ++i) {
        cin >> e[i].u >> e[i].v >> e[i].w;
        e[i].id = i;
    }
    build_forest(n, m);
    int q;
    cin >> q;
    while (q--) {
        int u, v;
        cin >> u >> v;
        if (find(u) != find(v)) cout << "impossible\n";
        else cout << path_max(u, v) << '\n';
    }
    return 0;
}
