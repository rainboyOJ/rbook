#include <bits/stdc++.h>
using namespace std;
using ll = long long;

/*------------------------ sgt 代码 开始 ------------------------*/
// 懒标记线段树：维护数组 base[1..n]，支持区间加、区间和。
// 节点与区间均为 1 下标。无取模版本（和可为负）。
ll base[maxn];
ll tr[maxn << 2];
ll lazy[maxn << 2];

int ls(int p) { return p << 1; }      // p 的左儿子 2p
int rs(int p) { return p << 1 | 1; }  // p 的右儿子 2p+1

void apply(int p, int l, int r, ll value) {
    tr[p] += value * (r - l + 1);
    lazy[p] += value;
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
        tr[p] = base[l];
        return;
    }
    int mid = (l + r) >> 1;
    seg_build(ls(p), l, mid);
    seg_build(rs(p), mid + 1, r);
    tr[p] = tr[ls(p)] + tr[rs(p)];
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
    tr[p] = tr[ls(p)] + tr[rs(p)];
}

ll range_sum(int ql, int qr, int p, int l, int r) {
    if (qr < l || r < ql) return 0;
    if (ql <= l && r <= qr) return tr[p];
    pushdown(p, l, r);
    int mid = (l + r) >> 1;
    ll answer = range_sum(ql, qr, ls(p), l, mid);
    answer += range_sum(ql, qr, rs(p), mid + 1, r);
    return answer;
}
/*------------------------ sgt 代码 结束 ------------------------*/
