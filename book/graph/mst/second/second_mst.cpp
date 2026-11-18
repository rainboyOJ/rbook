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

const int LOG = 18;
const ll INF = 1LL << 62;
const ll NEG = -(1LL << 62);  // 不存在第二种边权，且小于模板允许的所有边权

struct TreeEdge {
    int to;
    ll w;
};

struct Info {
    ll mx1, mx2;  // 最大值、严格小于最大值的次大值
};

vector<TreeEdge> g[maxn];
bool in_mst[maxm];  // 按原始边编号标记，排序后仍能区分重边
int dep[maxn], up[maxn][LOG], que[maxn];
ll mx1[maxn][LOG], mx2[maxn][LOG];

void add_value(Info &a, ll x) {
    if (x == NEG) return;
    if (x > a.mx1) {
        a.mx2 = a.mx1;
        a.mx1 = x;
    } else if (x < a.mx1 && x > a.mx2) {
        a.mx2 = x;  // 与最大值相等的数不能成为严格次大值
    }
}

Info merge_info(Info a, const Info &b) {
    add_value(a, b.mx1);
    add_value(a, b.mx2);
    return a;
}

Info segment(int u, int j) {
    return {mx1[u][j], mx2[u][j]};
}

bool build_mst(int n, int m, ll &total) {
    init(n);
    for (int u = 1; u <= n; ++u) g[u].clear();
    fill(in_mst, in_mst + m, false);
    sort(e, e + m, cmp);
    total = 0;
    int selected = 0;
    for (int i = 0; i < m && selected < n - 1; ++i) {
        if (!unite(e[i].u, e[i].v)) continue;
        in_mst[e[i].id] = true;
        total += e[i].w;
        ++selected;
        g[e[i].u].push_back({e[i].v, e[i].w});
        g[e[i].v].push_back({e[i].u, e[i].w});
    }
    return selected == n - 1;
}

void build_lifting(int n) {
    for (int u = 0; u <= n; ++u) {
        dep[u] = 0;
        for (int j = 0; j < LOG; ++j) {
            up[u][j] = 0;
            mx1[u][j] = mx2[u][j] = NEG;
        }
    }
    // 用数组队列遍历树，链形 MST 也不会造成递归栈过深。
    int head = 0, tail = 0;
    que[tail++] = 1;
    dep[1] = 1;
    while (head < tail) {
        int u = que[head++];
        for (auto [v, w] : g[u]) {
            if (v == up[u][0]) continue;
            dep[v] = dep[u] + 1;
            up[v][0] = u;
            mx1[v][0] = w;
            for (int j = 1; j < LOG; ++j) {
                int p = up[v][j - 1];
                up[v][j] = up[p][j - 1];
                Info a = merge_info(segment(v, j - 1), segment(p, j - 1));
                mx1[v][j] = a.mx1;
                mx2[v][j] = a.mx2;
            }
            que[tail++] = v;
        }
    }
}

Info path_info(int u, int v) {
    Info answer{NEG, NEG};
    if (dep[u] < dep[v]) swap(u, v);
    int diff = dep[u] - dep[v];
    for (int j = LOG - 1; j >= 0; --j) {
        if (diff >> j & 1) {
            answer = merge_info(answer, segment(u, j));
            u = up[u][j];
        }
    }
    if (u == v) return answer;
    for (int j = LOG - 1; j >= 0; --j) {
        if (up[u][j] != up[v][j]) {
            answer = merge_info(answer, segment(u, j));
            answer = merge_info(answer, segment(v, j));
            u = up[u][j];
            v = up[v][j];
        }
    }
    answer = merge_info(answer, segment(u, 0));
    return merge_info(answer, segment(v, 0));
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
    ll total;
    if (!build_mst(n, m, total)) {
        cout << -1 << '\n';
        return 0;
    }
    build_lifting(n);
    ll answer = INF;
    for (int i = 0; i < m; ++i) {
        const Edge &edge = e[i];
        if (in_mst[edge.id] || edge.u == edge.v) continue;
        Info a = path_info(edge.u, edge.v);
        ll removed = NEG;
        if (edge.w > a.mx1) removed = a.mx1;
        else if (edge.w == a.mx1) removed = a.mx2;
        if (removed != NEG) {
            answer = min(answer, total + edge.w - removed);
        }
    }
    // 原题保证严格次小生成树存在；本模板额外约定无解时输出 -1。
    if (answer == INF) cout << -1 << '\n';
    else cout << answer << '\n';
    return 0;
}
