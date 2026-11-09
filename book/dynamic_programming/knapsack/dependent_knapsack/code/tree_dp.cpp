// 有依赖的背包：依赖关系是一棵森林，加虚拟根 0 变成一棵树
// 选了儿子就必须选父亲，所以对每个点 u：
//   1. 先把所有儿子的 dp 数组合并进来（每个儿子是一个「物品组」，至多选一个方案）
//   2. 再强制把 u 自己放进去（j >= w[u] 时才有值，否则无解）
// 儿子用链式前向星存，不依赖 STL 容器
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3 + 5;
const int NEG = -1e9;

int n, C;
int w[maxn], v[maxn];
int f[maxn][maxn];      // f[u][j]：以 u 为根的子树，装了 u，花费 j 的最大价值

int head[maxn], nxt[maxn], to[maxn], ecnt;   // 链式前向星存儿子

void add(int p, int u) {                     // p 是父亲，u 是儿子
    to[++ecnt] = u; nxt[ecnt] = head[p]; head[p] = ecnt;
}

void dfs(int u) {
    // 先把 u 自己放进去：花费 w[u] 才有价值 v[u]
    for (int j = 0; j <= C; ++j)
        f[u][j] = (j >= w[u]) ? v[u] : NEG;

    for (int e = head[u]; e; e = nxt[e]) {
        int son = to[e];
        dfs(son);
        // 合并儿子：枚举分给「已合并部分」多少容量
        for (int j = C; j >= 0; --j) {
            for (int k = 0; k <= j; ++k) {
                if (f[u][j - k] == NEG || f[son][k] == NEG) continue;
                f[u][j] = max(f[u][j], f[u][j - k] + f[son][k]);
            }
        }
    }
}

int main() {
    cin >> n >> C;
    for (int i = 1; i <= n; ++i) {
        int p;
        cin >> w[i] >> v[i] >> p;
        add(p, i);                  // p=0 时自然挂到虚拟根 0 下
    }

    dfs(0);

    // 根 0 不占容量、不产生价值，答案就是 f[0][C]（可以什么都不选）
    cout << max(0, f[0][C]) << endl;
    return 0;
}
