#include <bits/stdc++.h>
using namespace std;

// 内向基环树（每个点恰好一条出边，即函数图）：找环并求每个点的答案。
// 对应洛谷 P2921：从 i 出发沿 nxt 一直走，直到回到去过的点，问经过多少个点。
// 约定：n 个点 n 条边，nxt[u] 是 u 的唯一出边指向的点，允许自环。
const int maxn = 100000 + 5;

int n;
int nxt[maxn]; // nxt[u]：u 的唯一后继

/*------------------------ 内向基环树 代码 开始 ------------------------*/
int indeg[maxn]; // indeg[u]：u 的入度
bool in_cycle[maxn]; // in_cycle[u]：u 是否在环上
int cyc_len[maxn];   // cyc_len[u]：u 所在环的长度（只对环上的点有意义）
int ans[maxn];       // ans[u]：从 u 出发回到已访问点时经过的点的个数

vector<int> order; // 拓扑剥叶的出队顺序，环外的点都在里面

// 第一步：拓扑排序剥掉所有不在环上的点。
// 出度为 1 的图里，“入度能降到 0 的点”就是挂在环外面的点；
// 剥完之后只剩下环，剥不掉。
void peel() {
    queue<int> q;
    for (int u = 1; u <= n; ++u) {
        in_cycle[u] = true;
        if (indeg[u] == 0) q.push(u);
    }

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        in_cycle[u] = false; // 能出队就说明不在环上
        order.push_back(u);

        int v = nxt[u];
        if (--indeg[v] == 0) q.push(v);
    }
}

// 第二步：给环上的每个点标上它所在环的长度。
// 从任意一个还没标记的环上点出发绕一圈，走回自己就是整圈。
void mark_cycle_len() {
    for (int u = 1; u <= n; ++u) {
        if (!in_cycle[u] || cyc_len[u]) continue;

        int len = 0;
        int x = u;
        do {
            cyc_len[x] = 0; // 先占位，避免重复进入
            x = nxt[x];
            ++len;
        } while (x != u);

        x = u;
        do {
            cyc_len[x] = len;
            x = nxt[x];
        } while (x != u);
    }
}

// 第三步：环外的点逆着拓扑序递推。
// 因为它下一步一定走向 nxt[u]，而 nxt[u] 的答案此时已经算好。
void calc_answer() {
    for (int u = 1; u <= n; ++u) {
        ans[u] = in_cycle[u] ? cyc_len[u] : 0;
    }
    for (int i = (int)order.size() - 1; i >= 0; --i) {
        int u = order[i];
        ans[u] = ans[nxt[u]] + 1; // 走一步到 nxt[u]，再加上它之后的步数
    }
}
/*------------------------ 内向基环树 代码 结束 ------------------------*/

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n;
    for (int u = 1; u <= n; ++u) {
        cin >> nxt[u];
        ++indeg[nxt[u]];
    }

    peel();
    mark_cycle_len();
    calc_answer();

    for (int u = 1; u <= n; ++u) {
        cout << ans[u] << '\n';
    }
    return 0;
}
