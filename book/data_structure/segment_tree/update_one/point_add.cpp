#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 500000 + 5;
int n, m;
// a 保存原数组；tr[p] 保存节点 p 对应区间的和。
// 节点编号与原数组下标不同，按孩子编号存树时预留 4 倍空间。
ll a[maxn], tr[maxn * 4];

// 左右孩子的区间不重叠，父区间和等于两个孩子之和。
void pushup(int p) {
    tr[p] = tr[ls(p)] + tr[rs(p)];
}

// 建立节点 p，表示原数组下标区间 [l,r]。
void build(int p, int l, int r) {
    if (l == r) {
        tr[p] = a[l];  // l == r：叶子对应一个原数组元素
        return;
    }
    int mid = l + (r - l) / 2;
    build(ls(p), l, mid);
    build(rs(p), mid + 1, r);
    pushup(p);
}

// 让 a[pos] 加 v；只进入包含 pos 的孩子，回溯时修正祖先。
void add(int p, int l, int r, int pos, ll v) {
    if (l == r) {
        tr[p] += v;
        return;
    }
    int mid = l + (r - l) / 2;
    if (pos <= mid) add(ls(p), l, mid, pos, v);
    else add(rs(p), mid + 1, r, pos, v);
    pushup(p);
}

// 当前节点表示 [l,r]，目标查询范围是 [L,R]。
ll query(int p, int l, int r, int L, int R) {
    if (r < L || R < l) return 0;  // 空交集对求和没有贡献
    if (L <= l && r <= R) return tr[p];  // 完整覆盖，直接使用预存的和
    int mid = l + (r - l) / 2;
    // 部分相交：交给两个孩子判断，各自返回的区间互不重叠。
    return query(ls(p), l, mid, L, R)
         + query(rs(p), mid + 1, r, L, R);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    build(1, 1, n);  // 根编号为 1，表示整个数组 [1,n]
    while (m--) {
        int op;
        cin >> op;
        // 1 pos v：单点加；2 l r：区间求和。
        if (op == 1) {
            int pos;
            ll v;
            cin >> pos >> v;
            add(1, 1, n, pos, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << query(1, 1, n, l, r) << '\n';
        }
    }
    return 0;
}
