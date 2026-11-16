#include <bits/stdc++.h>
#include <cassert>
using namespace std;

const int maxn = 100000 + 5;
const int maxnode = maxn * 18;
const int value_limit = 100000;
int tot, root[maxn];
int lc[maxnode], rc[maxnode], mx[maxnode], best[maxnode];

void pushup(int p) {
    int child = mx[lc[p]] >= mx[rc[p]] ? lc[p] : rc[p];
    mx[p] = mx[child];
    best[p] = best[child];
}

void insert(int &p, int l, int r, int x) {
    if (!p) {
        assert(tot + 1 < maxnode);
        p = ++tot;
    }
    if (l == r) {
        ++mx[p];
        best[p] = l;
        return;
    }
    int mid = l + (r - l) / 2;
    if (x <= mid) insert(lc[p], l, mid, x);
    else insert(rc[p], mid + 1, r, x);
    pushup(p);
}

// 破坏性合并；调用后不再独立使用旧的 b。
int merge_tree(int a, int b, int l, int r) {
    if (!a || !b) return a ? a : b;
    if (l == r) {
        mx[a] += mx[b];
        best[a] = l;
        return a;
    }
    int mid = l + (r - l) / 2;
    lc[a] = merge_tree(lc[a], lc[b], l, mid);
    rc[a] = merge_tree(rc[a], rc[b], mid + 1, r);
    pushup(a);
    return a;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    while (q--) {
        int op, a;
        cin >> op >> a;
        if (op == 1) {
            int x;
            cin >> x;
            insert(root[a], 1, value_limit, x);
        } else if (op == 2) {
            int b;
            cin >> b;
            assert(a != b);
            root[a] = merge_tree(root[a], root[b], 1, value_limit);
            root[b] = 0;
        } else {
            cout << best[root[a]] << '\n';
        }
    }
    return 0;
}
