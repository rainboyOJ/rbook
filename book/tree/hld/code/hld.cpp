#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// 节点与区间均为 1 下标；init -> 填 a / 加边 -> build -> 操作。
// n >= 1，1 <= mod <= 2^31-1；所有权值、增量用 long long。
const int maxn = 100000 + 5;  // 按题目规模调整，n 不能超过 maxn

int n, mod;
vector<int> g[maxn];
int fa[maxn], dep[maxn], sz[maxn], son[maxn], top[maxn], dfn[maxn], rev[maxn];
ll a[maxn], base[maxn], tr[maxn << 2], lazy[maxn << 2];

ll norm(ll x) { return (x % mod + mod) % mod; }

// 多组数据只需要清邻接表：旧边必须走。
// 其余数组在 build() / seg_build() 里逐点重新赋值，旧值不会影响结果。
void init(int count, int modulus) {
    n = count; mod = modulus;
    for (int u = 1; u <= n; ++u) g[u].clear();
}

void add_edge(int u, int v) {
    g[u].push_back(v); g[v].push_back(u);
}

void apply(int u, int l, int r, long long value) {
    value = norm(value);
    tr[u] = (tr[u] + value * (r - l + 1)) % mod;
    lazy[u] = (lazy[u] + value) % mod;
}

void pushdown(int u, int l, int r) {
    if (lazy[u] == 0 || l == r) return;
    int mid = (l + r) >> 1;
    apply(u << 1, l, mid, lazy[u]);
    apply(u << 1 | 1, mid + 1, r, lazy[u]);
    lazy[u] = 0;
}

void seg_build(int u, int l, int r) {
    lazy[u] = 0;  // 建树时顺手清懒标记，init 就不必整体清零
    if (l == r) {
        tr[u] = norm(base[l]);
        return;
    }
    int mid = (l + r) >> 1;
    seg_build(u << 1, l, mid);
    seg_build(u << 1 | 1, mid + 1, r);
    tr[u] = (tr[u << 1] + tr[u << 1 | 1]) % mod;
}

void range_add(int ql, int qr, long long value, int u, int l, int r) {
    if (ql <= l && r <= qr) {
        apply(u, l, r, value);
        return;
    }
    pushdown(u, l, r);
    int mid = (l + r) >> 1;
    if (ql <= mid) range_add(ql, qr, value, u << 1, l, mid);
    if (qr > mid) range_add(ql, qr, value, u << 1 | 1, mid + 1, r);
    tr[u] = (tr[u << 1] + tr[u << 1 | 1]) % mod;
}

long long range_sum(int ql, int qr, int u, int l, int r) {
    if (ql <= l && r <= qr) return tr[u];
    pushdown(u, l, r);
    int mid = (l + r) >> 1;
    long long answer = 0;
    if (ql <= mid) answer += range_sum(ql, qr, u << 1, l, mid);
    if (qr > mid) answer += range_sum(ql, qr, u << 1 | 1, mid + 1, r);
    return answer % mod;
}

// 第一遍：先记录父亲在前的顺序，再逆序汇总子树信息。
// 第二遍：显式栈模拟重儿子优先 DFS，避免链形树的 O(n) 递归栈。
void build(int root) {
    static int order[maxn], stk[maxn];
    int cnt = 0;
    order[cnt++] = root;
    fa[root] = 0; dep[root] = 1;  // 显式写根父亲，不依赖 fa 的预清零
    for (int i = 0; i < cnt; ++i) {
        int u = order[i];
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            fa[v] = u; dep[v] = dep[u] + 1;
            order[cnt++] = v;
        }
    }
    for (int i = n - 1; i >= 0; --i) {
        int u = order[i];
        sz[u] = 1; son[u] = 0;
        int best = 0, best_size = 0;  // 局部变量比较，不依赖 son[] 的旧值
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            sz[u] += sz[v];
            if (sz[v] > best_size) { best_size = sz[v]; best = v; }
        }
        son[u] = best;
    }
    int timer = 0, tp = 0;
    stk[tp++] = root;
    top[root] = root;
    while (tp > 0) {
        int u = stk[--tp];
        dfn[u] = ++timer; rev[timer] = u; base[timer] = a[u];
        // 轻儿子先入栈，重儿子后入栈，故重儿子先被访问。
        for (int v : g[u]) {
            if (v == fa[u] || v == son[u]) continue;
            top[v] = v; stk[tp++] = v;
        }
        if (son[u]) {
            top[son[u]] = top[u]; stk[tp++] = son[u];
        }
    }
    seg_build(1, 1, n);
}

int lca(int u, int v) {
    while (top[u] != top[v]) {
        if (dep[top[u]] < dep[top[v]]) swap(u, v);
        u = fa[top[u]];
    }
    return dep[u] < dep[v] ? u : v;
}

void path_add(int u, int v, long long delta) {
    while (top[u] != top[v]) {
        if (dep[top[u]] < dep[top[v]]) swap(u, v);
        range_add(dfn[top[u]], dfn[u], delta, 1, 1, n);
        u = fa[top[u]];
    }
    if (dep[u] > dep[v]) swap(u, v);
    range_add(dfn[u], dfn[v], delta, 1, 1, n);
}

long long path_sum(int u, int v) {
    long long answer = 0;
    while (top[u] != top[v]) {
        if (dep[top[u]] < dep[top[v]]) swap(u, v);
        answer += range_sum(dfn[top[u]], dfn[u], 1, 1, n);
        answer %= mod;
        u = fa[top[u]];
    }
    if (dep[u] > dep[v]) swap(u, v);
    answer += range_sum(dfn[u], dfn[v], 1, 1, n);
    return answer % mod;
}

void subtree_add(int u, long long delta) {
    range_add(dfn[u], dfn[u] + sz[u] - 1, delta, 1, 1, n);
}

long long subtree_sum(int u) {
    return range_sum(dfn[u], dfn[u] + sz[u] - 1, 1, 1, n);
}


int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int count, m, root, modulus;
    cin >> count >> m >> root >> modulus;

    init(count, modulus);
    for (int i = 1; i <= n; i++) {
        cin >> a[i];
        a[i] = norm(a[i]);
    }

    for (int i = 1; i < n; i++) {
        int u, v;
        cin >> u >> v;
        add_edge(u, v);
    }

    build(root);

    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int x, y;
            long long z;
            cin >> x >> y >> z;
            path_add(x, y, z);
        } else if (op == 2) {
            int x, y;
            cin >> x >> y;
            cout << path_sum(x, y) << '\n';
        } else if (op == 3) {
            int x;
            long long z;
            cin >> x >> z;
            subtree_add(x, z);
        } else {
            int x;
            cin >> x;
            cout << subtree_sum(x) << '\n';
        }
    }

    return 0;
}
