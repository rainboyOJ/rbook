#include <bits/stdc++.h>
#include <cassert>
using namespace std;

typedef long long ll;

const int maxq = 100000;
// 当前值域的根到叶子至多 32 个节点，按最多 maxq 次修改预留。
const int maxnode = maxq * 32 + 5;
const ll minx = -1000000000LL, maxx = 1000000000LL;
// 0 表示空节点；lc、rc 显式保存孩子编号，不能再用 2p、2p+1。
int root, tot, lc[maxnode], rc[maxnode];
// 初始全零，空子树的区间和为 0；tr[p] 保存已发生修改的累计和。
ll tr[maxnode];

// 节点池按顺序分配，断言避免超出预留容量；全局数组初值为 0。
int new_node() {
    assert(tot + 1 < maxnode);
    return ++tot;
}

// 引用参数 p 把新编号写回 root 或孩子数组；只创建修改经过的路径。
void add(int &p, ll l, ll r, ll pos, ll v) {
    if (!p) p = new_node();
    tr[p] += v;  // 当前区间包含 pos，其总和也增加 v
    if (l == r) return;
    ll mid = l + (r - l) / 2;
    if (pos <= mid) add(lc[p], l, mid, pos, v);
    else add(rc[p], mid + 1, r, pos, v);
}

// 查询 [L,R] 的和；查询过程只读，不分配任何节点。
ll query(int p, ll l, ll r, ll L, ll R) {
    if (!p || r < L || R < l) return 0;  // 空子树仍为全零，或没有交集
    if (L <= l && r <= R) return tr[p];
    ll mid = l + (r - l) / 2;
    return query(lc[p], l, mid, L, R) + query(rc[p], mid + 1, r, L, R);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    while (q--) {
        int op;
        ll x, y;
        cin >> op >> x >> y;
        // 1 x v：坐标 x 加 v；2 l r：查询坐标区间和。
        if (op == 1) add(root, minx, maxx, x, y);
        else cout << query(root, minx, maxx, x, y) << '\n';
    }
    return 0;
}
