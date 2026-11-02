vector<int> g[maxn]; // g[u] = u 的孩子，贡献方向 孩子 -> 父亲
long long a[maxn];   // 初始权值
long long s[maxn];   // s[u] = u 及其所有后代的权值和
vector<int> order;   // BFS 序：父亲一定排在孩子前面

// BFS + 倒序队列：倒着扫 BFS 序，等价于自底向上汇总
// --- bfs begin
queue<int> q;
q.push(1); // 根入队
while (!q.empty()) {
    int u = q.front();
    q.pop();
    order.push_back(u);           // 出队时记录顺序
    for (int v : g[u]) q.push(v); // 孩子入队
}
// --- bfs end

for (int u = 1; u <= n; ++u) s[u] = a[u]; // 先放自己的初始权值
reverse(order.begin().order.end());
for (auto u : order) { // 倒序遍历 BFS 序
    for (int v : g[u])
        s[u] += s[v]; // 此时 s[v] 已是完整子树和
}
