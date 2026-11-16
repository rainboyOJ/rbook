#include <bits/stdc++.h>
#include <cassert>
using namespace std;

const int maxn = 100000 + 5;
// 值域 [1,10^5] 的一条路径至多 18 个节点；合并不分配新节点。
const int maxnode = maxn * 18;
const int value_limit = 100000;
// 每个集合保存一个根；不同有效集合的节点互不共享。
int tot, root[maxn];
// mx[p] 是该值域中最大的频次；best[p] 是达到它的最小数值。
// 0 号节点表示空树，频次和答案都为 0。
int lc[maxnode], rc[maxnode], mx[maxnode], best[maxnode];

// 频次相同时选左孩子，因为左半值域中的数更小。
void pushup(int p) {
    int child = mx[lc[p]] >= mx[rc[p]] ? lc[p] : rc[p];
    mx[p] = mx[child];
    best[p] = best[child];
}

// 向值域频次树插入一个 x；缺失节点按需创建并写回根或孩子。
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

// 合并两个表示相同值域 [l,r] 的节点，返回结果根。
// 破坏性合并：复用、改写旧节点，之后不能独立使用旧的 b。
int merge_tree(int a, int b, int l, int r) {
    if (!a || !b) return a ? a : b;  // 一侧为空，整棵接过来，无须逐点插入
    if (l == r) {
        mx[a] += mx[b];  // 两个叶子代表同一个值，出现次数相加
        best[a] = l;
        return a;
    }
    int mid = l + (r - l) / 2;
    // 分别合并对应的左右值域，再由孩子重新选出众数。
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
            root[b] = 0;  // 节点已转交给 a；清空旧根，避免再次修改同一批节点
        } else {
            // 只需读取根维护的众数；空集合的 root 为 0，答案也为 0。
            cout << best[root[a]] << '\n';
        }
    }
    return 0;
}
