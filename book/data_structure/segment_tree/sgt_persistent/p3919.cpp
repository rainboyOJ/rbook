#include <bits/stdc++.h>
#include <cassert>
using namespace std;

const int maxn = 1000000 + 5;
// 初始树约 2n 个节点；每次修改至多复制 ceil(log2(n))+1 个节点。
const int maxnode = maxn * 23;
int n, m, tot;
// root[v] 是版本 v 的根；不同版本允许共享未修改的子树。
int a[maxn], root[maxn];
// lc、rc 保存孩子编号；本篇只查单点，value 仅在叶子有意义。
int lc[maxnode], rc[maxnode], value[maxnode];

// 所有版本共用节点池，已发布版本中的节点不再原地修改。
int new_node() {
    assert(tot + 1 < maxnode);
    return ++tot;
}

// 建立初始数组，返回表示 [l,r] 的根编号。
int build(int l, int r) {
    int p = new_node();
    if (l == r) {
        value[p] = a[l];
        return p;
    }
    int mid = l + (r - l) / 2;
    lc[p] = build(l, mid);
    rc[p] = build(mid + 1, r);
    return p;
}

// 基于旧节点 old 修改 pos，返回新节点；旧版本始终保持不变。
int modify(int old, int l, int r, int pos, int v) {
    int p = new_node();
    // 先复制节点；未走入的那一侧继续共享旧孩子。
    lc[p] = lc[old];
    rc[p] = rc[old];
    value[p] = value[old];
    if (l == r) {
        value[p] = v;  // 只修改新路径上的叶子
        return p;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) lc[p] = modify(lc[old], l, mid, pos, v);
    else rc[p] = modify(rc[old], mid + 1, r, pos, v);
    return p;
}

// 从指定版本的根出发，只沿 pos 所在的一条路径读取，不创建节点。
int query(int p, int l, int r, int pos) {
    if (l == r) return value[p];
    int mid = l + (r - l) / 2;
    if (pos <= mid) return query(lc[p], l, mid, pos);
    return query(rc[p], mid + 1, r, pos);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    root[0] = build(1, n);  // 版本 0 是初始数组
    for (int i = 1; i <= m; ++i) {
        int v, op, pos;
        cin >> v >> op >> pos;
        // 第 i 次操作生成版本 i，可以基于任意已有版本 v 分支。
        if (op == 1) {
            int x;
            cin >> x;
            root[i] = modify(root[v], 1, n, pos, x);
        } else {
            cout << query(root[v], 1, n, pos) << '\n';
            root[i] = root[v];  // 查询也生成版本，直接复用被查询版本的根
        }
    }
    return 0;
}
