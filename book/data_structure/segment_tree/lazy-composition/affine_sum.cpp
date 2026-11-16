#include <bits/stdc++.h>
using namespace std;

const int maxn = 100000 + 5;
int n, q;
long long mod, a[maxn], tr[maxn * 4];
long long mul[maxn * 4], inc[maxn * 4];

long long norm(long long x) {
    x %= mod;
    if (x < 0) x += mod;
    return x;
}

void pushup(int p) {
    tr[p] = (tr[p * 2] + tr[p * 2 + 1]) % mod;
}

void build(int p, int l, int r) {
    mul[p] = 1 % mod;
    if (l == r) {
        tr[p] = norm(a[l]);
        return;
    }
    int mid = l + (r - l) / 2;
    build(p * 2, l, mid);
    build(p * 2 + 1, mid + 1, r);
    pushup(p);
}

// 在已有变换之后，执行 x -> A*x+B；A、B 已归一化。
void apply(int p, int l, int r, long long A, long long B) {
    tr[p] = (tr[p] * A % mod + B * (r - l + 1) % mod) % mod;
    mul[p] = mul[p] * A % mod;
    inc[p] = (inc[p] * A % mod + B) % mod;
}

void pushdown(int p, int l, int r) {
    if (mul[p] == 1 % mod && inc[p] == 0) return;
    int mid = l + (r - l) / 2;
    apply(p * 2, l, mid, mul[p], inc[p]);
    apply(p * 2 + 1, mid + 1, r, mul[p], inc[p]);
    mul[p] = 1 % mod;
    inc[p] = 0;
}

void update(int p, int l, int r, int L, int R, long long A, long long B) {
    if (L <= l && r <= R) {
        apply(p, l, r, A, B);
        return;
    }
    pushdown(p, l, r);
    int mid = l + (r - l) / 2;
    if (L <= mid) update(p * 2, l, mid, L, R, A, B);
    if (R > mid) update(p * 2 + 1, mid + 1, r, L, R, A, B);
    pushup(p);
}

long long query(int p, int l, int r, int L, int R) {
    if (L <= l && r <= R) return tr[p];
    pushdown(p, l, r);
    int mid = l + (r - l) / 2;
    long long answer = 0;
    if (L <= mid) answer += query(p * 2, l, mid, L, R);
    if (R > mid) answer += query(p * 2 + 1, mid + 1, r, L, R);
    return answer % mod;
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
            long long v;
            cin >> v;
            if (op == 1) update(1, 1, n, l, r, norm(v), 0);
            else update(1, 1, n, l, r, 1 % mod, norm(v));
        }
    }
    return 0;
}
