#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
const int maxm = 2000000 + 5;

struct Edge {
    int to, id;
};

vector<Edge> g[maxn];
vector<int> block[maxn], tree[maxn];
int eu[maxm], ev[maxm];  // 每条原始无向边只记录一份端点
int dfn[maxn], low[maxn], belong[maxn], degree[maxn];
bool is_bridge[maxm];
int timer = 0, bcc_count = 0, connected_count = 0;

int parent[maxn], parent_edge[maxn], next_edge[maxn], stk[maxn];

// 第一遍：显式模拟递归 DFS，退出孩子时才向父亲回传 low。
void dfs_bridge(int root, int in_edge) {
    int top = 0;
    parent[root] = 0;
    parent_edge[root] = in_edge;
    next_edge[root] = 0;
    dfn[root] = low[root] = ++timer;
    stk[top++] = root;
    while (top) {
        int u = stk[top - 1];
        if (next_edge[u] == (int)g[u].size()) {
            --top;  // u 的全部邻边处理完，对应递归返回
            int p = parent[u];
            if (p != 0) {
                low[p] = min(low[p], low[u]);
                if (low[u] > dfn[p]) is_bridge[parent_edge[u]] = true;
            }
            continue;
        }
        auto [v, id] = g[u][next_edge[u]++];
        if (id == parent_edge[u]) continue;
        if (!dfn[v]) {
            parent[v] = u;
            parent_edge[v] = id;
            next_edge[v] = 0;
            dfn[v] = low[v] = ++timer;
            stk[top++] = v;
        } else if (dfn[v] < dfn[u]) {
            low[u] = min(low[u], dfn[v]);
        }
    }
}

// 第二遍：普通栈遍历，入栈时立即标记，每个点只入栈一次。
void paint(int start, int color) {
    int top = 0;
    belong[start] = color;
    stk[top++] = start;
    while (top) {
        int u = stk[--top];
        for (auto [v, id] : g[u]) {
            if (is_bridge[id] || belong[v]) continue;
            belong[v] = color;
            stk[top++] = v;
        }
    }
}

void build_components(int n) {
    for (int u = 1; u <= n; ++u) {
        if (dfn[u]) continue;
        ++connected_count;
        dfs_bridge(u, -1);
    }
    for (int u = 1; u <= n; ++u) {
        if (!belong[u]) paint(u, ++bcc_count);
    }
    // 按原编号收集成员，使每个分量内的输出顺序固定。
    for (int u = 1; u <= n; ++u) block[belong[u]].push_back(u);
}

void build_forest(int m) {
    for (int id = 0; id < m; ++id) {
        if (!is_bridge[id]) continue;
        int a = belong[eu[id]], b = belong[ev[id]];
        tree[a].push_back(b);
        tree[b].push_back(a);
        ++degree[a];
        ++degree[b];
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int id = 0; id < m; ++id) {
        cin >> eu[id] >> ev[id];
        g[eu[id]].push_back({ev[id], id});
        g[ev[id]].push_back({eu[id], id});
    }
    build_components(n);
    build_forest(m);  // 保存桥树/森林，不额外输出，供后续应用使用

    cout << bcc_count << '\n';
    for (int color = 1; color <= bcc_count; ++color) {
        cout << block[color].size();
        for (int u : block[color]) cout << ' ' << u;
        cout << '\n';
    }
    return 0;
}
