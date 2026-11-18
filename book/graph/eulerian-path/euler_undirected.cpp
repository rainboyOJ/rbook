#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
const int maxm = 500000 + 5;

struct Edge {
    int to, id;
};

vector<Edge> g[maxn];
int deg[maxn], cur[maxn];
bool used[maxm];
// 栈与答案保存的是行走中的顶点，可重复，容量要按边数设置。
int st[maxm + 1], path[maxm + 1];
int top = 0, length = 0;

void hierholzer(int s) {
    st[top++] = s;
    while (top) {
        int u = st[top - 1];
        int &i = cur[u];  // 保留扫描位置，不从头反复寻找可用边
        while (i < (int)g[u].size() && used[g[u][i].id]) ++i;

        if (i == (int)g[u].size()) {
            path[length++] = u;  // 无边可走时记录，答案逆序产生
            --top;
        } else {
            auto [v, id] = g[u][i++];
            used[id] = true;  // 两条邻接记录共享边号，只能使用一次
            st[top++] = v;
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int id = 0; id < m; ++id) {
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});
        g[v].push_back({u, id});
        ++deg[u];
        ++deg[v];  // 若 u == v，自环恰好贡献两次度数
    }

    int s = 0, first = 0, odd = 0;
    for (int u = 1; u <= n; ++u) {
        if (deg[u] && !first) first = u;
        if (deg[u] % 2) {
            ++odd;
            if (!s) s = u;  // 开放的欧拉路必须从奇度点出发
        }
    }
    if (odd != 0 && odd != 2) {
        cout << "NO\n";
        return 0;
    }
    if (!s) s = first ? first : 1;  // 回路从有边点出发；无边时取顶点 1

    hierholzer(s);
    if (length != m + 1) {  // 度数条件通过后，用覆盖边数检查连通性
        cout << "NO\n";
        return 0;
    }
    reverse(path, path + length);
    for (int i = 0; i < length; ++i) {
        if (i) cout << ' ';
        cout << path[i];
    }
    cout << '\n';
    return 0;
}
