#include <bits/stdc++.h>
#include <cassert>
using namespace std;

typedef long long ll;

const int maxn = 200000 + 5;
// n≤2×10^5，每次插入至多复制 19 个节点，预留 20n。
const int maxnode = maxn * 20;
int n, m, kinds, tot;
// a 保留原数组顺序；values 排序去重后，将值域编号还原为原值。
ll a[maxn], values[maxn];
// root[i] 记录前 i 项的值域频次树；0 号节点表示全零的空树。
int root[maxn], lc[maxnode], rc[maxnode], cnt[maxnode];

// 在旧前缀版本上插入一个值域编号 pos，复制路径并返回新根。
int insert(int old, int l, int r, int pos) {
    assert(tot + 1 < maxnode);
    int p = ++tot;
    // 复制两个孩子编号；稍后只替换包含 pos 的孩子，另一侧继续共享。
    lc[p] = lc[old];
    rc[p] = rc[old];
    cnt[p] = cnt[old] + 1;  // 插入值属于当前值域，总次数增加 1
    if (l == r) return p;
    int mid = (l + r) / 2;
    if (pos <= mid) lc[p] = insert(lc[old], l, mid, pos);
    else rc[p] = insert(rc[old], mid + 1, r, pos);
    return p;
}

// before 是目标下标区间之前的前缀根，now 是其右端点处的前缀根。
// [l,r] 是当前值域；两棵树同步向下，用频次之差统计目标区间。
int kth(int before, int now, int l, int r, int k) {
    if (l == r) return l;  // 得到值域编号，还需用 values 还原数值
    int mid = (l + r) / 2;
    int left_count = cnt[lc[now]] - cnt[lc[before]];  // 目标区间落在左半值域的次数
    if (k <= left_count) return kth(lc[before], lc[now], l, mid, k);
    // 跳过左边的 left_count 个数，在右边继续找剩余排名。
    return kth(rc[before], rc[now], mid + 1, r, k - left_count);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        values[i] = a[i];
    }
    // 所有前缀共用同一套离散化与区间划分，对应节点才能相减。
    sort(values + 1, values + n + 1);
    kinds = int(unique(values + 1, values + n + 1) - values - 1);
    for (int i = 1; i <= n; ++i) {
        int pos = int(lower_bound(values + 1, values + kinds + 1, a[i]) - values);
        root[i] = insert(root[i - 1], 1, kinds, pos);  // 前 i-1 项再加入 a[i]
    }
    while (m--) {
        int l, r, k;
        cin >> l >> r >> k;
        // 前 r 项减去前 l-1 项，只留下下标区间 [l,r] 的频次。
        int id = kth(root[l - 1], root[r], 1, kinds, k);
        cout << values[id] << '\n';
    }
    return 0;
}
