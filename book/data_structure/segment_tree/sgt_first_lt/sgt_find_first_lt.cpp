#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 200000 + 5;
int n, m;
// tr[p] 保存当前下标区间的最小值，用来判断整段能否排除。
ll a[maxn], tr[maxn * 4];

// 父区间最小值由左右孩子取 min 得到。
void pushup(int p) {
    tr[p] = min(tr[ls(p)], tr[rs(p)]);
}

// 节点 p 表示下标区间 [l,r]，叶子存原数组元素。
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

// 把 a[pos] 赋为 v，再沿修改路径向上维护最小值。
void assign_point(int p, int l, int r, int pos, ll v) {
    if (l == r) {
        tr[p] = v;
        return;
    }
    int mid = (l + r) / 2;
    if (pos <= mid) assign_point(ls(p), l, mid, pos, v);
    else assign_point(rs(p), mid + 1, r, pos, v);
    pushup(p);
}

// 在 [L,R] 中找首个 a[i]<x 的位置，无解返回 n+1。
int first_less(int p, int l, int r, int L, int R, ll x) {
    // 不相交，或整段最小值仍不小于 x，都不可能提供答案。
    if (r < L || R < l || tr[p] >= x) return n + 1;
    if (l == r) return l;  // 通过剪枝的叶子一定满足 a[l]<x
    int mid = (l + r) / 2;
    // 先查较小下标；左边有解即可停止，不必再访问右边。
    int answer = first_less(ls(p), l, mid, L, R, x);
    if (answer != n + 1) return answer;
    return first_less(rs(p), mid + 1, r, L, R, x);
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
        // 1 pos v：单点赋值；2 l r x：查找首个严格小于 x 的位置。
        if (op == 1) {
            int pos;
            ll v;
            cin >> pos >> v;
            assign_point(1, 1, n, pos, v);
        } else {
            int l, r;
            ll x;
            cin >> l >> r >> x;
            cout << first_less(1, 1, n, l, r, x) << '\n';
        }
    }
    return 0;
}
