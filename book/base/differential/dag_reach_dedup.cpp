vector<int> g[maxn];              // g[v] = v 的后继
int indeg[maxn];
long long a[maxn];
long long s[maxn];                // s[u] = 能到达 u 的来源（含自身）的权值和
bitset<maxn> reach[maxn];         // reach[u] = 能到达 u 的节点集合（含 u 自己）

// 每个可达节点只贡献一次：沿边做集合并，再对集合内的权值求和
void dag_reach_dedup() {
    vector<int> order;            // 拓扑序
    queue<int> q;
    for (int u = 1; u <= n; ++u) {
        reach[u].reset();
        reach[u].set(u);          // 自己一定能到达自己
        if (indeg[u] == 0) q.push(u);
    }

    while (!q.empty()) {
        int v = q.front();
        q.pop();
        order.push_back(v);
        for (int u : g[v]) {
            reach[u] |= reach[v]; // 集合并：v 能到达的，u 也能到达
            if (--indeg[u] == 0) q.push(u);
        }
    }

    for (int u = 1; u <= n; ++u) {
        s[u] = 0;
        for (int v = 1; v <= n; ++v)
            if (reach[u].test(v)) s[u] += a[v];
    }
}
