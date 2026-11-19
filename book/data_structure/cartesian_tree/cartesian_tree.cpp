#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 10000000 + 5;  // P5854 的 n 最大为 10^7
int a[maxn], ls[maxn], rs[maxn], st[maxn];

int build(int n) {
    int top = 0;
    for (int i = 1; i <= n; ++i) {
        int last = 0;
        ls[i] = rs[i] = 0;
        // st 保存当前树从根到最右节点的路径。
        // 只弹出权值更大的节点：相等时，先出现的节点优先。
        while (top && a[st[top]] > a[i]) last = st[top--];
        if (top) rs[st[top]] = i;  // i 接到未弹出节点的右侧
        ls[i] = last;              // 最后弹出的节点，其整棵子树移到 i 左侧
        st[++top] = i;
    }
    return top ? st[1] : 0;  // 栈底始终是根；空树返回 0
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 1; i <= n; ++i) cin >> a[i];
    build(n);  // 构造并填充左右孩子数组

    ll answer_l = 0, answer_r = 0;
    for (int i = 1; i <= n; ++i) {
        // 先转为 long long 再乘，避免 int 乘法溢出。
        answer_l ^= 1LL * i * (ls[i] + 1);
        answer_r ^= 1LL * i * (rs[i] + 1);
    }
    cout << answer_l << ' ' << answer_r << '\n';
    return 0;
}
