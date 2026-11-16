#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
int q, kinds, op[maxn], cnt[maxn * 4];
long long operand[maxn], values[maxn];

void change(int p, int l, int r, int pos, int delta) {
    cnt[p] += delta;
    if (l == r) return;
    int mid = l + (r - l) / 2;
    if (pos <= mid) change(p * 2, l, mid, pos, delta);
    else change(p * 2 + 1, mid + 1, r, pos, delta);
}

int prefix_count(int p, int l, int r, int pos) {
    if (pos < l) return 0;
    if (r <= pos) return cnt[p];
    int mid = l + (r - l) / 2;
    if (pos <= mid) return prefix_count(p * 2, l, mid, pos);
    return cnt[p * 2] + prefix_count(p * 2 + 1, mid + 1, r, pos);
}

int kth(int p, int l, int r, int k) {
    if (l == r) return l;
    int mid = l + (r - l) / 2;
    if (k <= cnt[p * 2]) return kth(p * 2, l, mid, k);
    return kth(p * 2 + 1, mid + 1, r, k - cnt[p * 2]);
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
