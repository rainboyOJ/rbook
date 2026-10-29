#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// 树链剖分（HLD）+ 懒标记线段树，节点与区间均为 1 下标。
const int maxn = 100000 + 5;

int n, mod;

/*------------------------ sgt 代码 开始 ------------------------*/
// 懒标记线段树：维护数组 base[1..n]，支持区间加、区间和对 mod 取模。
ll base[maxn];
ll tr[maxn << 2];
ll lazy[maxn << 2];

ll norm(ll x) { return (x % mod + mod) % mod; }

int ls(int o) { return o << 1; }      // o 的左儿子 2o
int rs(int o) { return o << 1 | 1; }  // o 的右儿子 2o+1

void apply(int o, int l, int r, ll value) {
    value = norm(value);
    tr[o] = (tr[o] + value * (r - l + 1)) % mod;
    lazy[o] = (lazy[o] + value) % mod;
}

void pushdown(int o, int l, int r) {
    // 懒标记为 0 无事可做；叶子没有儿子可下放，必须提前返回，
    // 否则 mid = l，会递归进入自己并且写越界的 tr[2o]。
    if (!lazy[o] || l == r) return;
    int mid = (l + r) >> 1;
    apply(ls(o), l, mid, lazy[o]);
    apply(rs(o), mid + 1, r, lazy[o]);
    lazy[o] = 0;
}

void seg_build(int o, int l, int r) {
    lazy[o] = 0;
    if (l == r) {
        tr[o] = norm(base[l]);
        return;
    }
    int mid = (l + r) >> 1;
    seg_build(ls(o), l, mid);
    seg_build(rs(o), mid + 1, r);
    tr[o] = (tr[ls(o)] + tr[rs(o)]) % mod;
}

void range_add(int ql, int qr, ll value, int o, int l, int r) {
    if (ql <= l && r <= qr) {
        apply(o, l, r, value);
        return;
    }
    pushdown(o, l, r);
    int mid = (l + r) >> 1;
    if (ql <= mid) range_add(ql, qr, value, ls(o), l, mid);
    if (qr > mid) range_add(ql, qr, value, rs(o), mid + 1, r);
    tr[o] = (tr[ls(o)] + tr[rs(o)]) % mod;
}

ll range_sum(int ql, int qr, int o, int l, int r) {
    if (ql <= l && r <= qr) return tr[o];
    pushdown(o, l, r);
    int mid = (l + r) >> 1;
    ll answer = 0;
    if (ql <= mid) answer += range_sum(ql, qr, ls(o), l, mid);
    if (qr > mid) answer += range_sum(ql, qr, rs(o), mid + 1, r);
    return answer % mod;
}
/*------------------------ sgt 代码 结束 ------------------------*/

/*------------------------ hld 代码 开始 ------------------------*/
// 树链剖分：g 存树，a 存原点权，6 个核心数组维护树上信息。
vector<int> g[maxn];
ll a[maxn];

int fa[maxn];   // fa[u]：父亲，根的 fa 为 0
int dep[maxn];  // dep[u]：深度，根为 1
int sz[maxn];   // sz[u]：子树大小（含自己）
int son[maxn];  // son[u]：重儿子，叶子为 0
int top[maxn];  // top[u]：所在重链的链头
int dfn[maxn];  // dfn[u]：线段树上的位置（DFS 新编号）
int timer;

// 多组数据只需要清邻接表：旧边必须走。
// 其余数组在 dfs1 / dfs2 / seg_build 里逐点重新赋值，旧值不会影响结果。
void init(int _n, int _mod) {
    n = _n;
    mod = _mod;
    for (int u = 1; u <= n; ++u) g[u].clear();
}

void add_edge(int u, int v) {
    g[u].push_back(v);
    g[v].push_back(u);
}

// 第一遍 DFS：往下求 fa、dep，回溯时汇总 sz 并选出重儿子 son
void dfs1(int u, int father) {
    fa[u] = father;
    dep[u] = dep[father] + 1;  // 根的 father 为 0、dep[0] 恒为 0，故根深度为 1
    sz[u] = 1;                 // 先算上自己
    son[u] = 0;                // 叶子没有重儿子
    for (int v : g[u]) {
        if (v == father) continue;
        dfs1(v, u);
        sz[u] += sz[v];
        if (sz[v] > sz[son[u]]) son[u] = v;
    }
}

// 第二遍 DFS：重儿子优先分配 dfn，保证重链连续
void dfs2(int u, int head) {
    top[u] = head;
    dfn[u] = ++timer;
    base[timer] = a[u];  // 把点权搬到 sgt 段的数组上，线段树维护的就是它
    if (son[u]) dfs2(son[u], head);
    for (int v : g[u]) {
        if (v == fa[u] || v == son[u]) continue;
        dfs2(v, v);
    }
}

// 预处理入口：两遍 DFS 把树拍成 dfn 序，再建线段树。
void build(int root) {
    dfs1(root, 0);       // 填 fa / dep / sz / son
    timer = 0;
    dfs2(root, root);    // 填 top / dfn / base
    seg_build(1, 1, n);  // 交给 sgt 段
}

int lca(int u, int v) {
    while (top[u] != top[v]) {
        if (dep[top[u]] < dep[top[v]]) swap(u, v);
        u = fa[top[u]];
    }
    return dep[u] < dep[v] ? u : v;
}

void path_add(int u, int v, ll delta) {
    while (top[u] != top[v]) {
        if (dep[top[u]] < dep[top[v]]) swap(u, v);
        range_add(dfn[top[u]], dfn[u], delta, 1, 1, n);
        u = fa[top[u]];
    }
    if (dep[u] > dep[v]) swap(u, v);
    range_add(dfn[u], dfn[v], delta, 1, 1, n);
}

ll path_sum(int u, int v) {
    ll answer = 0;
    while (top[u] != top[v]) {
        if (dep[top[u]] < dep[top[v]]) swap(u, v);
        answer = (answer + range_sum(dfn[top[u]], dfn[u], 1, 1, n)) % mod;
        u = fa[top[u]];
    }
    if (dep[u] > dep[v]) swap(u, v);
    answer = (answer + range_sum(dfn[u], dfn[v], 1, 1, n)) % mod;
    return answer;
}

void subtree_add(int u, ll delta) {
    range_add(dfn[u], dfn[u] + sz[u] - 1, delta, 1, 1, n);
}

ll subtree_sum(int u) {
    return range_sum(dfn[u], dfn[u] + sz[u] - 1, 1, 1, n);
}
/*------------------------ hld 代码 结束 ------------------------*/
