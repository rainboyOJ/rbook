#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 100000 + 5;
int n, q;
// 区间和对 mod 取模；乘积使用 ll，模板要求 mod ≤ 10^9+7。
ll mod, a[maxn], tr[maxn * 4];
// 待下传标记表示 x -> mul[p]*x + inc[p]，尚未作用于孩子。
ll mul[maxn * 4], inc[maxn * 4];

// C++ 的负数取模可能为负，将外来数值统一到 [0,mod-1]。
ll norm(ll x) {
    x %= mod;
    if (x < 0) x += mod;
    return x;
}

// 左右区间和相加后仍需取模。
void pushup(int p) {
    tr[p] = (tr[ls(p)] + tr[rs(p)]) % mod;
}

// 建立节点 p 表示的 [l,r]。加法标记默认为 0，乘法标记须设为 1。
void build(int p, int l, int r) {
    mul[p] = 1 % mod;  // 单位变换；取模写法兼容 mod == 1
    if (l == r) {
        tr[p] = norm(a[l]);
        return;
    }
    int mid = (l + r) / 2;
    build(ls(p), l, mid);
    build(rs(p), mid + 1, r);
    pushup(p);
}

// 在旧变换 x -> a*x+b 之后执行 x -> A*x+B；A、B 已归一化。
// 合成结果为 x -> (A*a)*x + (A*b+B)，时间顺序不能交换。
void apply(int p, int l, int r, ll A, ll B) {
    tr[p] = (tr[p] * A % mod + B * (r - l + 1) % mod) % mod;  // B 贡献 len 次
    mul[p] = mul[p] * A % mod;
    inc[p] = (inc[p] * A % mod + B) % mod;  // 新乘法也会放大旧加法
}

// 进入孩子前，将父标记作为较新的变换复合到孩子，再恢复单位标记。
void pushdown(int p, int l, int r) {
    if (mul[p] == 1 % mod && inc[p] == 0) return;
    int mid = (l + r) / 2;
    apply(ls(p), l, mid, mul[p], inc[p]);
    apply(rs(p), mid + 1, r, mul[p], inc[p]);
    mul[p] = 1 % mod;
    inc[p] = 0;
}

// 对 [L,R] 中每个数执行 A*x+B；完整覆盖时不再向下递归。
void update(int p, int l, int r, int L, int R, ll A, ll B) {
    if (r < L || R < l) return;  // 空交集直接返回，不修改节点
    if (L <= l && r <= R) {
        apply(p, l, r, A, B);
        return;
    }
    pushdown(p, l, r);
    int mid = (l + r) / 2;
    update(ls(p), l, mid, L, R, A, B);
    update(rs(p), mid + 1, r, L, R, A, B);
    pushup(p);
}

// 不相交返回 0，完整覆盖返回节点和；部分相交才下传并合并。
ll query(int p, int l, int r, int L, int R) {
    if (r < L || R < l) return 0;
    if (L <= l && r <= R) return tr[p];
    pushdown(p, l, r);
    int mid = (l + r) / 2;
    return (query(ls(p), l, mid, L, R)
          + query(rs(p), mid + 1, r, L, R)) % mod;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> q >> mod;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    build(1, 1, n);
    while (q--) {
        int op, l, r;
        cin >> op >> l >> r;
        if (op == 3) {
            cout << query(1, 1, n, l, r) << '\n';
        } else {
            ll v;
            cin >> v;
            // 乘 v 对应 (v,0)，加 v 对应 (1,v)。
            if (op == 1) update(1, 1, n, l, r, norm(v), 0);
            else update(1, 1, n, l, r, 1 % mod, norm(v));
        }
    }
    return 0;
}
