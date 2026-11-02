vector<int> g[maxn];   // g[u] = u 的孩子，贡献方向 孩子 -> 父亲
long long a[maxn];     // 初始权值
long long s[maxn];     // s[u] = u 及其所有后代的权值和

// 后序遍历：先算完所有孩子，再把它们打包好的贡献收上来
void dfs(int u) {
    s[u] = a[u];                 // 先放自己的初始权值
    for (int v : g[u]) {
        dfs(v);
        s[u] += s[v];            // 孩子子树和已经算好，直接收上来
    }
}
