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

void dfs(int u, int in_edge) {
    dfn[u] = low[u] = ++timer;
    int children = 0;
    for (auto [v, id] : g[u]) {
        if (id == in_edge) continue;
        if (!dfn[v]) {
            ++children;
            edge_stack[edge_top++] = id;  // 树边在进入孩子前入栈
            dfs(v, id);
            low[u] = min(low[u], low[v]);
            if (low[v] >= dfn[u]) {
                if (in_edge != -1) cut[u] = true;
                make_block(id);         // 根也要执行出块，不能加“非根”限制
            }
        } else if (dfn[v] < dfn[u]) {
            edge_stack[edge_top++] = id; // 回边只从后代看向祖先时入栈一次
            low[u] = min(low[u], dfn[v]);
        }
    }
    if (in_edge == -1) cut[u] = (children >= 2);
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
