#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

const int maxn = 1500 + 5;
const ll INF = 1LL << 60;

vector<int> g[maxn];
int cost[maxn];
bool has_parent[maxn];
ll f[maxn][3];

void dfs(int u) {
    f[u][1] = cost[u];  // 选择 u
    f[u][2] = 0;        // u 未被子树覆盖，等待父亲选择
    ll base = 0, extra = INF;

    for (int v : g[u]) {
        dfs(v);
        // u 选择后，可以接纳孩子的全部三种状态。
        f[u][1] += min({f[v][0], f[v][1], f[v][2]});
        // u 必须尚未被覆盖，因此孩子不能选，也不能等待 u。
        f[u][2] = min(INF, f[u][2] + f[v][0]);

        ll best = min(f[v][0], f[v][1]);
        base += best;  // u 不选，孩子必须在自己的子树内得到覆盖
        extra = min(extra, f[v][1] - best);  // 强制一个孩子选择的最小补差
    }
    // 没有孩子时，无法通过孩子覆盖 u。
    f[u][0] = (extra == INF ? INF : base + extra);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 1; i <= n; ++i) {
        int u, k;
        cin >> u >> k;
        cost[u] = k;
        int children;
        cin >> children;
        while (children--) {
            int v;
            cin >> v;
            g[u].push_back(v);  // P2458 已给出父亲到孩子的方向
            has_parent[v] = true;
        }
    }

    int root = 1;
    while (has_parent[root]) ++root;
    dfs(root);
    // 根没有父亲，不能接受等待父亲覆盖的状态 2。
    cout << min(f[root][0], f[root][1]) << '\n';
    return 0;
}
