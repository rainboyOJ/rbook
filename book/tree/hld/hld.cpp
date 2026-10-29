#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// 节点与区间均为 1 下标；init -> 填 a / 加边 -> build -> 操作。
// n >= 1，1 <= mod <= 2^31-1；所有权值、增量用 long long。
int n, mod;
vector<vector<int>> g;
vector<int> fa, dep, sz, son, top, dfn, rev;
vector<ll> a, base, tr, lazy;

ll norm(ll x) { return (x % mod + mod) % mod; }

void init(int count, int modulus) {
    n = count; mod = modulus;
    g.assign(n + 1, {});
    fa.assign(n + 1, 0); dep.assign(n + 1, 0);
    sz.assign(n + 1, 0); son.assign(n + 1, 0);
    top.assign(n + 1, 0); dfn.assign(n + 1, 0); rev.assign(n + 1, 0);
    a.assign(n + 1, 0); base.assign(n + 1, 0);
    tr.assign(4 * n + 5, 0); lazy.assign(4 * n + 5, 0);
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

void seg_build(int u, int l, int r, const vector<long long> &base) {
    if (l == r) {
        tr[u] = norm(base[l]);
        return;
    }
    int mid = (l + r) >> 1;
    seg_build(u << 1, l, mid, base);
    seg_build(u << 1 | 1, mid + 1, r, base);
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
    vector<int> order{root};
    dep[root] = 1;
    for (int i = 0; i < n; ++i) {
        int u = order[i];
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            fa[v] = u; dep[v] = dep[u] + 1;
            order.push_back(v);
        }
    }
    for (int i = n - 1; i >= 0; --i) {
        int u = order[i];
        sz[u] = 1;
        for (int v : g[u]) {
            if (v == fa[u]) continue;
            sz[u] += sz[v];
            if (sz[v] > sz[son[u]]) son[u] = v;
        }
    }
    int timer = 0;
    vector<int> st{root};
    top[root] = root;
    while (!st.empty()) {
        int u = st.back(); st.pop_back();
        dfn[u] = ++timer; rev[timer] = u; base[timer] = a[u];
        // 轻儿子先入栈，重儿子后入栈，故重儿子先被访问。
        for (int v : g[u]) {
            if (v == fa[u] || v == son[u]) continue;
            top[v] = v; st.push_back(v);
        }
        if (son[u]) {
            top[son[u]] = top[u]; st.push_back(son[u]);
        }
    }
    seg_build(1, 1, n, base);
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
