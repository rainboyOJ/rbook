#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 100000 + 5;
int a[maxn], ls[maxn], rs[maxn], st[maxn];
int order[maxn], siz[maxn];

int build(int n) {
    int top = 0;
    for (int i = 1; i <= n; ++i) {
        int last = 0;
        ls[i] = rs[i] = 0;  // 多组输入时清除上一棵树的孩子
        while (top && a[st[top]] > a[i]) last = st[top--];
        if (top) rs[st[top]] = i;
        ls[i] = last;
        st[++top] = i;
    }
    return top ? st[1] : 0;
}

ll largest_rectangle(int root) {
    int top = 0, count = 0;
    if (root) st[++top] = root;
    while (top) {
        int u = st[top--];
        order[++count] = u;  // 先记录父亲，再访问孩子
        if (ls[u]) st[++top] = ls[u];
        if (rs[u]) st[++top] = rs[u];
    }

    ll answer = 0;
    // 倒序处理，保证两个孩子的子树大小已经算完。
    for (int i = count; i >= 1; --i) {
        int u = order[i];
        siz[u] = siz[ls[u]] + siz[rs[u]] + 1;  // siz[0] 始终为 0
        answer = max(answer, 1LL * a[u] * siz[u]);
    }
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    while (cin >> n && n) {
        for (int i = 1; i <= n; ++i) cin >> a[i];
        cout << largest_rectangle(build(n)) << '\n';
    }
    return 0;
}
