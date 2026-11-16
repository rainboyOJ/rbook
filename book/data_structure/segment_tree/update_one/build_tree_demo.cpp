// 建树演示：递归建立线段树，并输出整棵树（节点编号、区间、区间和）。
#include <bits/stdc++.h>
using namespace std;

typedef long long ll;

int ls(int p) { return p << 1; }      // 左孩子 2p
int rs(int p) { return p << 1 | 1; }  // 右孩子 2p+1

const int maxn = 100000 + 5;
int n;
// a 的下标是数组位置；tr 的下标是树节点编号，两者不能混用。
ll a[maxn], tr[maxn * 4];

// 由两个孩子重新算出父亲
void pushup(int p) {
    tr[p] = tr[ls(p)] + tr[rs(p)];
}

// 建立区间 [l,r]、编号为 p 的节点
void build(int p, int l, int r) {
    if (l == r) {          // 叶子：直接取原数组
        tr[p] = a[l];
        return;
    }
    int mid = (l + r) / 2;
    build(ls(p), l, mid);          // 左孩子
    build(rs(p), mid + 1, r);  // 右孩子
    pushup(p);                     // 回溯时合并
}

// 先序输出整棵树：编号 p、区间 [l,r]、区间和 tr[p]
void print(int p, int l, int r, int depth) {
    // 每层增加两个空格，先打印当前节点，再打印左右子树。
    cout << string(depth * 2, ' ')
         << "node " << p << " [" << l << "," << r << "] sum=" << tr[p] << '\n';
    if (l == r) return;
    int mid = (l + r) / 2;
    print(ls(p), l, mid, depth + 1);
    print(rs(p), mid + 1, r, depth + 1);
}

int main() {
    cin >> n;
    for (int i = 1; i <= n; ++i) cin >> a[i];

    build(1, 1, n);   // 根编号 1，管整个区间 [1,n]
    print(1, 1, n, 0);
    return 0;
}
