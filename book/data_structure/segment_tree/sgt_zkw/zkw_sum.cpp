#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 500000 + 5;
// 叶子编号从 base 开始，a[i] 放在 base+i，两侧各留一个哨兵位置。
int n, m, base;
// tr[p] 保存节点区间和；哨兵和补齐叶子的值均为 0。
ll tr[maxn * 4];

// 直接定位叶子，再逐层上移，重新计算祖先区间和。
void add(int pos, ll v) {
    int p = base + pos;
    tr[p] += v;
    for (p /= 2; p; p /= 2) tr[p] = tr[ls(p)] + tr[rs(p)];
}

// 查询闭区间 [l,r]：两侧边界放在 l-1、r+1，夹住尚未计入的部分。
ll query(int l, int r) {
    int L = base + l - 1, R = base + r + 1;
    ll answer = 0;
    while (L / 2 != R / 2) {  // 两侧成为兄弟时，中间已无剩余子树
        if (L % 2 == 0) answer += tr[L + 1];  // 左边界是左孩子：右兄弟在范围内
        if (R % 2 == 1) answer += tr[R - 1];  // 右边界是右孩子：左兄弟在范围内
        // 计入内侧兄弟后，两侧同时上移一层。
        L /= 2;
        R /= 2;
    }
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    base = 1;
    // 至少容纳 n 个元素和两个哨兵，再补齐到 2 的幂。
    while (base < n + 2) base *= 2;
    for (int i = 1; i <= n; ++i) cin >> tr[base + i];
    // 倒序合并内部节点，确保访问父亲前两个孩子已经计算完成。
    for (int p = base - 1; p >= 1; --p) tr[p] = tr[ls(p)] + tr[rs(p)];
    while (m--) {
        int op;
        cin >> op;
        // 1 pos v：单点加；2 l r：区间求和。
        if (op == 1) {
            int pos;
            ll v;
            cin >> pos >> v;
            add(pos, v);
        } else {
            int l, r;
            cin >> l >> r;
            cout << query(l, r) << '\n';
        }
    }
    return 0;
}
