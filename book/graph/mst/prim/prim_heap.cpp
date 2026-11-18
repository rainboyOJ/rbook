#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
const int maxn = 200000 + 5;
const ll INF = 1LL << 62;

struct Edge {
    int to;
    ll w;
};

vector<Edge> g[maxn];
ll dis[maxn];
int pre[maxn];
bool vis[maxn];

bool prim(int n, ll &answer) {
    for (int i = 1; i <= n; ++i) {
        dis[i] = INF;
        pre[i] = 0;
        vis[i] = false;
    }
    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<pair<ll, int>>> heap;
    dis[1] = 0;
    heap.push({0, 1});
    answer = 0;
    int selected = 0;
    while (!heap.empty()) {
        auto [cost, u] = heap.top();
        heap.pop();
        if (vis[u]) continue;  // 旧候选可能仍在堆内，每个点只能入树一次
        vis[u] = true;
        ++selected;
        answer += cost;
        for (auto [v, w] : g[u]) {
            if (!vis[v] && w < dis[v]) {
                dis[v] = w;
                pre[v] = u;
                heap.push({dis[v], v});
            }
        }
    }
    return selected == n;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int i = 0; i < m; ++i) {
        int u, v;
        ll w;
        cin >> u >> v >> w;
        g[u].push_back({v, w});
        g[v].push_back({u, w});
    }
    ll answer;
    if (prim(n, answer)) cout << answer << '\n';
    else cout << "orz\n";
    return 0;
}
