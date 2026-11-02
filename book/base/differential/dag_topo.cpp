vector<int> g[maxn]; // g[v] = v 的后继，贡献沿 v -> u 传递
int indeg[maxn];     // indeg[u] = u 还有几个前驱的贡献没收到
long long a[maxn];   // 初始权值
long long s[maxn];   // s[u] = 沿所有路径收到的贡献之和

// 拓扑序：保证处理 u 时，所有能到达 u 的前驱都已处理完
void dag_topo() {
    for (int u = 1; u <= n; ++u) s[u] = a[u]; // 先放自己的初始权值

    queue<int> q;
    for (int u = 1; u <= n; ++u)
        if (indeg[u] == 0) q.push(u); // 没有前驱的先入队

    while (!q.empty()) {
        int v = q.front();
        q.pop();
        for (int u : g[v]) {
            s[u] += s[v]; // v 的整包贡献交给 u
            if (--indeg[u] == 0) q.push(u); // u 已收齐，可以继续往后传
        }
    }
}
