#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 100000 + 5;
int n, m;
// tr[p] 是区间和；lazy[p] 是已计入该和、但尚未传给孩子的增量。
ll a[maxn], tr[maxn * 4], lazy[maxn * 4];

// 根据两个孩子重新计算父节点；部分修改结束后调用。
void pushup(int p) {
    tr[p] = tr[ls(p)] + tr[rs(p)];
}

// 节点 p 表示 [l,r]；先建孩子，再合并区间和。
void build(int p, int l, int r) {
    if (l == r) {
        tr[p] = a[l];
        return;
    }
    int mid = (l + r) / 2;
    build(ls(p), l, mid);
    build(rs(p), mid + 1, r);
    pushup(p);
}

// 整段每个元素都加 v：区间和增加 v×长度，待下传增量累加。
void apply(int p, int l, int r, ll v) {
    tr[p] += v * (r - l + 1);
    lazy[p] += v;
}

// 仅在需要进入孩子时调用；先补齐孩子的信息，再清除父标记。
void pushdown(int p, int l, int r) {
    if (lazy[p] == 0) return;
    int mid = (l + r) / 2;
    apply(ls(p), l, mid, lazy[p]);
    apply(rs(p), mid + 1, r, lazy[p]);
    lazy[p] = 0;  // 增量已交给孩子，不能再次下传
}

// 给目标区间 [L,R] 加 v；[l,r] 是当前节点表示的区间。
void add(int p, int l, int r, int L, int R, ll v) {
    if (r < L || R < l) return;  // 不相交，不修改，也不下传标记
    if (L <= l && r <= R) {
        apply(p, l, r, v);  // 完整覆盖，更新本节点的和与标记，不再访问叶子
        return;
    }
    pushdown(p, l, r);  // 部分修改前必须下传，再修改孩子并上推
    int mid = (l + r) / 2;
    add(ls(p), l, mid, L, R, v);
    add(rs(p), mid + 1, r, L, R, v);
    pushup(p);
}

// 查询 [L,R] 的和；只有部分相交时，才需要下传并递归。
ll query(int p, int l, int r, int L, int R) {
    if (r < L || R < l) return 0;  // 不相交，不能继续向下或下传标记
    if (L <= l && r <= R) return tr[p];  // 当前和已包含本节点的标记
    pushdown(p, l, r);
    int mid = (l + r) / 2;
    return query(ls(p), l, mid, L, R)
         + query(rs(p), mid + 1, r, L, R);
}

// 演示程序只读出实际存储值；不能用 query 打印整棵树，否则会触发下传。
void print_tree(int p, int l, int r, int depth) {
    cout << string(depth * 2, ' ') << "node " << p
         << " [" << l << "," << r << "] sum=" << tr[p]
         << " lazy=" << lazy[p] << '\n';
    if (l == r) return;
    int mid = (l + r) / 2;
    print_tree(ls(p), l, mid, depth + 1);
    print_tree(rs(p), mid + 1, r, depth + 1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    build(1, 1, n);
    cout << "initial\n";
    print_tree(1, 1, n, 0);
    while (m--) {
        int op, l, r;
        cin >> op >> l >> r;
        if (op == 1) {
            ll v;
            cin >> v;
            add(1, 1, n, l, r, v);
            cout << "after add [" << l << "," << r << "] value=" << v << '\n';
        } else {
            ll answer = query(1, 1, n, l, r);
            cout << "query [" << l << "," << r << "] = " << answer << '\n';
        }
        print_tree(1, 1, n, 0);
    }
    return 0;
}
