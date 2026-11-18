#include <bits/stdc++.h>
using namespace std;

const int maxn = 500000 + 5;
const int maxm = 2000000 + 5;

struct Edge {
    int to, id;
};

vector<Edge> g[maxn];
vector<int> block[maxn];
int eu[maxm], ev[maxm];
int dfn[maxn], low[maxn], mark[maxn], edge_stack[maxm];
bool cut[maxn];
int timer = 0, bcc_count = 0, edge_top = 0;

void add_vertex(int u) {
    if (mark[u] == bcc_count) return;
    mark[u] = bcc_count;  // 只在当前分量内去重，割点可以加入其他分量
    block[bcc_count].push_back(u);
}

void make_block(int stop_edge) {
    ++bcc_count;
    while (true) {
        int id = edge_stack[--edge_top];
        add_vertex(eu[id]);
        add_vertex(ev[id]);
        if (id == stop_edge) break;  // 必须包含触发出块的树边
    }
}

int parent[maxn], parent_edge[maxn], next_edge[maxn];
int child_count[maxn], dfs_stack[maxn];

// DFS 栈与分量边栈分开：退出孩子时，才更新 low 并检查出块。
void dfs(int root, int in_edge) {
    int top = 0;
    parent[root] = 0;
    parent_edge[root] = in_edge;
    next_edge[root] = child_count[root] = 0;
    dfn[root] = low[root] = ++timer;
    dfs_stack[top++] = root;
    while (top) {
        int u = dfs_stack[top - 1];
        if (next_edge[u] == (int)g[u].size()) {
            --top;
            int p = parent[u];
            if (p == 0) {
                cut[u] = (child_count[u] >= 2);
            } else {
                low[p] = min(low[p], low[u]);
                if (low[u] >= dfn[p]) {
                    if (parent[p] != 0) cut[p] = true;
                    make_block(parent_edge[u]);
                }
            }
            continue;
        }
        auto [v, id] = g[u][next_edge[u]++];
        if (id == parent_edge[u]) continue;
        if (!dfn[v]) {
            ++child_count[u];
            edge_stack[edge_top++] = id;
            parent[v] = u;
            parent_edge[v] = id;
            next_edge[v] = child_count[v] = 0;
            dfn[v] = low[v] = ++timer;
            dfs_stack[top++] = v;
        } else if (dfn[v] < dfn[u]) {
            edge_stack[edge_top++] = id;
            low[u] = min(low[u], dfn[v]);
        }
    }
}

void solve(int n) {
    for (int u = 1; u <= n; ++u) {
        if (dfn[u]) continue;
        dfs(u, -1);
        if (g[u].empty()) {
            ++bcc_count;
            add_vertex(u);  // 忽略自环后没有邻边的点，单独成块
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int id = 0; id < m; ++id) {
        cin >> eu[id] >> ev[id];
        if (eu[id] == ev[id]) continue;  // 自环不改变本题采用的顶点分块
        g[eu[id]].push_back({ev[id], id});
        g[ev[id]].push_back({eu[id], id});
    }
    solve(n);
    cout << bcc_count << '\n';
    for (int c = 1; c <= bcc_count; ++c) {
        cout << block[c].size();
        for (int u : block[c]) cout << ' ' << u;
        cout << '\n';
    }
    return 0;
}
