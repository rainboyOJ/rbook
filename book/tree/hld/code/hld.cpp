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

// 把可能为负的 x 归一到 [0, mod)：只用在“外来值”上（输入的初值和增量）。
ll norm(ll x) { return (x % mod + mod) % mod; }

int ls(int p) { return p << 1; }     // p 的左儿子 2p
int rs(int p) { return p << 1 | 1; } // p 的右儿子 2p+1

void apply(int p, int l, int r, ll value) {
    value = norm(value);
    tr[p] = (tr[p] + value * (r - l + 1)) % mod;
    lazy[p] = (lazy[p] + value) % mod;
}

void pushdown(int p, int l, int r) {
    // 懒标记为 0 无事可做；叶子没有儿子可下放，必须提前返回，
    // 否则 mid = l，会递归进入自己并且写越界的 tr[2p]。
    if (!lazy[p] || l == r) return;
    int mid = (l + r) >> 1;
    apply(ls(p), l, mid, lazy[p]);
    apply(rs(p), mid + 1, r, lazy[p]);
    lazy[p] = 0;
}

void seg_build(int p, int l, int r) {
    lazy[p] = 0;
    if (l == r) {
        tr[p] = norm(base[l]);
        return;
    }
    int mid = (l + r) >> 1;
    seg_build(ls(p), l, mid);
    seg_build(rs(p), mid + 1, r);
    tr[p] = (tr[ls(p)] + tr[rs(p)]) % mod;
}

// 区间加：把 [ql, qr] 整体加 value。
void range_add(int ql, int qr, ll value, int p, int l, int r) {
    if (qr < l || r < ql) return;
    if (ql <= l && r <= qr) {
        apply(p, l, r, value);
        return;
    }
    pushdown(p, l, r);
    int mid = (l + r) >> 1;
    range_add(ql, qr, value, ls(p), l, mid);
    range_add(ql, qr, value, rs(p), mid + 1, r);
    tr[p] = (tr[ls(p)] + tr[rs(p)]) % mod;
}

ll range_sum(int ql, int qr, int p, int l, int r) {
    if (qr < l || r < ql) return 0;
    if (ql <= l && r <= qr) return tr[p];
    pushdown(p, l, r);
    int mid = (l + r) >> 1;
    ll answer = range_sum(ql, qr, ls(p), l, mid);
    answer += range_sum(ql, qr, rs(p), mid + 1, r);
    return answer % mod;
}
/*------------------------ sgt 代码 结束 ------------------------*/

/*------------------------ hld 代码 开始 ------------------------*/
// 树链剖分：g 存树，a 存原点权，6 个核心数组维护树上信息。
vector<int> g[maxn];
ll a[maxn];

int fa[maxn];  // fa[u]：父亲，根的 fa 为 0
int dep[maxn]; // dep[u]：深度，根为 1
int sz[maxn];  // sz[u]：子树大小（含自己）
int son[maxn]; // son[u]：重儿子，叶子为 0
int top[maxn]; // top[u]：所在重链的链头
int dfn[maxn]; // dfn[u]：线段树上的位置（DFS 新编号）
int timer;

void add_edge(int u, int v) {
    g[u].push_back(v);
    g[v].push_back(u);
}

// 第一遍 DFS：往下求 fa、dep，回溯时汇总 sz 并选出重儿子 son
void dfs1(int u, int father) {
    fa[u] = father;
    dep[u] = dep[father] + 1; // 根的 father 为 0、dep[0] 恒为 0，故根深度为 1
    sz[u] = 1;                // 先算上自己
    son[u] = 0;               // 叶子没有重儿子
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
    base[timer] = a[u]; // 把点权搬到 sgt 段的数组上，线段树维护的就是它
    if (son[u]) dfs2(son[u], head);
    for (int v : g[u]) {
        if (v == fa[u] || v == son[u]) continue;
        dfs2(v, v);
    }
}

// 预处理入口：加完边之后调用一次。其余数组在 dfs1 / dfs2 / seg_build 里逐点覆写。
void build(int root) {
    dfs1(root, 0);      // 填 fa / dep / sz / son
    timer = 0;          // 从 1 重新分配 dfn
    dfs2(root, root);   // 填 top / dfn / base
    seg_build(1, 1, n); // 交给 sgt 段
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

/*------------------------ 读入输出 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int m, root;                  // 操作数、根
    cin >> n >> m >> root >> mod; // 点数和模数直接读进全局

    for (int u = 1; u <= n; ++u) g[u].clear(); // 多组数据：清掉上一组留下的边

    for (int i = 1; i <= n; i++) cin >> a[i]; // 原编号下的点权，取模在 seg_build 里做

    for (int i = 1; i < n; i++) {
        int u, v;
        cin >> u >> v;
        add_edge(u, v);
    }

    build(root); // 两遍 DFS + 建线段树

    while (m--) {
        int op;
        cin >> op;
        if (op == 1) {
            int x, y;
            ll z;
            cin >> x >> y >> z;
            path_add(x, y, z);
        } else if (op == 2) {
            int x, y;
            cin >> x >> y;
            cout << path_sum(x, y) << '\n';
        } else if (op == 3) {
            int x;
            ll z;
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
