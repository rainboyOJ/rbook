#include <bits/stdc++.h>
using namespace std;
using ll = long long;

// 懒标记线段树（区间加 + 区间和，取模），节点与区间均为 1 下标。
// 这是 sgt_update_range 章节的独立模板，sgt 段与 HLD 模板完全一致。
const int maxn = 100000 + 5;

int mod;  // 取模的模数，使用前先赋值（hld 模板里由读入设置）

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
