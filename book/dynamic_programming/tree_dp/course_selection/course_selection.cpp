#include <bits/stdc++.h>
using namespace std;

const int maxn = 300 + 5;
const int NEG = -1000000000;

vector<int> g[maxn];
int score[maxn], sz[maxn], f[maxn][maxn];
int n, m, K;

void dfs(int u) {
    for (int j = 0; j <= K; ++j) f[u][j] = NEG;
    f[u][0] = 0;         // 不选整个子树
    f[u][1] = score[u];  // 非空方案必须先选子树根 u
    sz[u] = 1;
    int next[maxn];

    for (int v : g[u]) {
        dfs(v);
        fill(next, next + K + 1, NEG);
        for (int a = 1; a <= min(sz[u], K); ++a) {
            if (f[u][a] == NEG) continue;
            for (int b = 0; b <= min(sz[v], K - a); ++b) {
                if (f[v][b] == NEG) continue;
                // a>=1 保证已选 u；b>0 时孩子方案保证已选 v。
                next[a + b] = max(next[a + b], f[u][a] + f[v][b]);
            }
        }
        for (int j = 1; j <= K; ++j) f[u][j] = next[j];
        sz[u] += sz[v];
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    cin >> n >> m;
    K = m + 1;  // DP 中把必选的虚拟根也算作一个节点
    for (int u = 1; u <= n; ++u) {
        int parent;
        cin >> parent >> score[u];
        g[parent].push_back(u);  // 无先修课的课程统一接到虚拟根 0
    }

    dfs(0);  // score[0]=0，不增加学分
    cout << f[0][K] << '\n';
    return 0;
}
