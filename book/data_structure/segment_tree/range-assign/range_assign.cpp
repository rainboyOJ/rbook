#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 100000 + 5;
int n, m;
// tr[p] 保存区间和；lazy[p] 保存待下传的统一赋值。
ll a[maxn], tr[maxn * 4], lazy[maxn * 4];
bool has[maxn * 4];  // 赋值为 0 也有效，必须单独记录标记是否存在

// 部分修改结束后，用两个孩子重新求出父区间和。
void pushup(int p) {
    tr[p] = tr[ls(p)] + tr[rs(p)];
}

// 建立表示 [l,r] 的节点 p，叶子取原数组值。
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

// 整段赋为 v：新赋值覆盖旧赋值，标记不能像加法那样累加。
void apply(int p, int l, int r, ll v) {
    tr[p] = v * (r - l + 1);
    lazy[p] = v;
    has[p] = true;
}

// 需要进入孩子时，把较新的父赋值覆盖到两个孩子。
void pushdown(int p, int l, int r) {
    if (!has[p]) return;
    int mid = (l + r) / 2;
    apply(ls(p), l, mid, lazy[p]);
    apply(rs(p), mid + 1, r, lazy[p]);
    has[p] = false;  // 父标记已传完；lazy[p] 的旧内容不再有效
}

// 把目标区间 [L,R] 赋为 v；完整覆盖直接更新，否则先下传。
void assign_range(int p, int l, int r, int L, int R, ll v) {
    if (r < L || R < l) return;  // 空交集直接返回，不修改节点
    if (L <= l && r <= R) {
        apply(p, l, r, v);
        return;
    }
    pushdown(p, l, r);
    int mid = (l + r) / 2;
    assign_range(ls(p), l, mid, L, R, v);
    assign_range(rs(p), mid + 1, r, L, R, v);
    pushup(p);
}

// 先排除空交集，再判断完整覆盖；部分相交才下传并查询孩子。
ll query(int p, int l, int r, int L, int R) {
    if (r < L || R < l) return 0;  // 0 是求和的单位元
    if (L <= l && r <= R) return tr[p];
    pushdown(p, l, r);
    int mid = (l + r) / 2;
    return query(ls(p), l, mid, L, R)
         + query(rs(p), mid + 1, r, L, R);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    build(1, 1, n);
    while (m--) {
        int op;
        cin >> op;
        // 1 l r v：区间赋值；2 l r：区间求和。
        if (op == 1) {
            int l, r;
            ll v;
            cin >> l >> r >> v;
            assign_range(1, 1, n, l, r, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << query(1, 1, n, l, r) << '\n';
        }
    }
    return 0;
}
