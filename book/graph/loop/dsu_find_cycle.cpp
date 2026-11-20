#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
struct Edge { int to, id; };

int n, m;
int fa[maxn], sz[maxn];
vector<Edge> g[maxn];            // 另存森林边；不能沿并查集 fa 恢复原图路径
int parent[maxn], parent_edge[maxn];  // 记录 BFS 路径上的父节点与来边编号
bool vis[maxn];
vector<int> cycle_v, cycle_e;

int find(int x) {
    if (fa[x] == x) return x;
    return fa[x] = find(fa[x]);
}

bool unite(int x, int y) {
    int fx = find(x), fy = find(y);
    if (fx == fy) return false;
    if (sz[fx] < sz[fy]) swap(fx, fy);
    fa[fy] = fx;
    sz[fx] += sz[fy];
    return true;
}

void recover_cycle(int from, int to, int fail_id) {
    queue<int> q;
    q.push(from);
    vis[from] = true;
    while (!q.empty()) {
        int x = q.front();
        q.pop();
        if (x == to) break;  // 森林中路径唯一，到达 to 即可结束
        for (Edge e : g[x]) {
            if (vis[e.to]) continue;
            vis[e.to] = true;
            parent[e.to] = x;
            parent_edge[e.to] = e.id;
            q.push(e.to);
        }
    }

    // 沿着 parent 从 to 回到 from，最后补上失败边闭合环（自环同样适用）。
    for (int x = to; x != from; x = parent[x]) {
        cycle_v.push_back(x);
        cycle_e.push_back(parent_edge[x]);
    }
    cycle_v.push_back(from);
    cycle_e.push_back(fail_id);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> m)) return 0;
    for (int u = 1; u <= n; ++u) {
        fa[u] = u;
        sz[u] = 1;
    }

    int fail_id = 0, from = 0, to = 0;
    for (int id = 1; id <= m; ++id) {
        int u, v;
        cin >> u >> v;
        if (unite(u, v)) {
            // 合并成功：加入森林，供后续恢复路径使用
            g[u].push_back({v, id});
            g[v].push_back({u, id});
        } else if (fail_id == 0) {
            // 两端已连通：只记录第一条使合并失败的环边
            fail_id = id;
            from = u;
            to = v;
        }
    }

    if (fail_id == 0) {
        cout << 0 << '\n';
        return 0;
    }

    recover_cycle(from, to, fail_id);

    cout << cycle_v.size() << '\n';
    for (auto i : cycle_v) cout << i << ' ';
    cout << '\n';
    for (auto i : cycle_e) cout << i << ' ';
    cout << '\n';
    return 0;
}
