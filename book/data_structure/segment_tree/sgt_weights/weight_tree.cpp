#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 200000 + 5;
int q, kinds, op[maxn], cnt[maxn * 4];
ll operand[maxn], values[maxn];

void change(int p, int l, int r, int pos, int delta) {
    cnt[p] += delta;
    if (l == r) return;
    int mid = l + (r - l) / 2;
    if (pos <= mid) change(ls(p), l, mid, pos, delta);
    else change(rs(p), mid + 1, r, pos, delta);
}

int prefix_count(int p, int l, int r, int pos) {
    if (pos < l) return 0;
    if (r <= pos) return cnt[p];
    int mid = l + (r - l) / 2;
    if (pos <= mid) return prefix_count(ls(p), l, mid, pos);
    return cnt[ls(p)] + prefix_count(rs(p), mid + 1, r, pos);
}

int kth(int p, int l, int r, int k) {
    if (l == r) return l;
    int mid = l + (r - l) / 2;
    if (k <= cnt[ls(p)]) return kth(ls(p), l, mid, k);
    return kth(rs(p), mid + 1, r, k - cnt[ls(p)]);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> q;
    for (int i = 1; i <= q; ++i) {
        cin >> op[i] >> operand[i];
        if (op[i] != 4) values[++kinds] = operand[i];
    }
    sort(values + 1, values + kinds + 1);
    kinds = int(unique(values + 1, values + kinds + 1) - values - 1);
    for (int i = 1; i <= q; ++i) {
        if (op[i] == 4) {
            cout << values[kth(1, 1, kinds, int(operand[i]))] << '\n';
            continue;
        }
        int pos = int(lower_bound(values + 1, values + kinds + 1, operand[i]) - values);
        if (op[i] == 1) change(1, 1, kinds, pos, 1);
        else if (op[i] == 2) change(1, 1, kinds, pos, -1);
        else if (op[i] == 3) cout << prefix_count(1, 1, kinds, pos - 1) + 1 << '\n';
        else if (op[i] == 5) {
            int k = prefix_count(1, 1, kinds, pos - 1);
            cout << values[kth(1, 1, kinds, k)] << '\n';
        } else {
            int k = prefix_count(1, 1, kinds, pos) + 1;
            cout << values[kth(1, 1, kinds, k)] << '\n';
        }
    }
    return 0;
}
