#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 200000 + 5;
// 这里 [l,r] 表示离散后的值域，不是原数组位置。
// cnt[p] 保存该值域中的总次数，重复值按出现次数累计。
int q, kinds, op[maxn], cnt[maxn * 4];
// operand 保存操作参数；values 保存排序去重后的原数值，供答案还原。
ll operand[maxn], values[maxn];

// 修改值域编号 pos 的频次：插入传 +1，删除一次出现传 -1。
// 删除要求该数存在，频次必须保持非负。
void change(int p, int l, int r, int pos, int delta) {
    cnt[p] += delta;
    if (l == r) return;
    int mid = (l + r) / 2;
    if (pos <= mid) change(ls(p), l, mid, pos, delta);
    else change(rs(p), mid + 1, r, pos, delta);
}

// 查询值域前缀 [1,pos] 的总次数；pos=0 表示空前缀。
int prefix_count(int p, int l, int r, int pos) {
    if (pos < l) return 0;  // 整个当前区间都在前缀右侧
    if (r <= pos) return cnt[p];  // 当前值域被前缀完整包含
    int mid = (l + r) / 2;
    return prefix_count(ls(p), l, mid, pos)
         + prefix_count(rs(p), mid + 1, r, pos);
}

// 查询第 k 小的值域编号，要求 1≤k≤cnt[p]。
int kth(int p, int l, int r, int k) {
    if (l == r) return l;
    int mid = (l + r) / 2;
    // 左边有 s 个数：k≤s 就向左，否则跳过左边，向右找第 k-s 小。
    if (k <= cnt[ls(p)]) return kth(ls(p), l, mid, k);
    return kth(rs(p), mid + 1, r, k - cnt[ls(p)]);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> q;
    // 先收集数值离散化；操作 4 的参数是排名，不能作为数值收集。
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
        // 排名 = 严格小于该值的次数 + 1，即查询 pos-1。
        else if (op[i] == 3) cout << prefix_count(1, 1, kinds, pos - 1) + 1 << '\n';
        else if (op[i] == 5) {
            int k = prefix_count(1, 1, kinds, pos - 1);  // 前驱：最后一个 <x 的数
            cout << values[kth(1, 1, kinds, k)] << '\n';
        } else {
            int k = prefix_count(1, 1, kinds, pos) + 1;  // 后继：跳过全部 ≤x 的数
            cout << values[kth(1, 1, kinds, k)] << '\n';
        }
    }
    return 0;
}
