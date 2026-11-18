#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
const int maxn = 200000 + 5;
const int maxm = 500000 + 5;

struct Edge {
    int u, v, id;
    ll w;
};

Edge e[maxm];
int fa[maxn], sz[maxn];

void init(int n) {
    for (int i = 1; i <= n; ++i) {
        fa[i] = i;
        sz[i] = 1;
    }
}

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

bool cmp(const Edge &a, const Edge &b) {
    if (a.w != b.w) return a.w < b.w;
    return a.id < b.id;  // 同权时按输入顺序，便于与正文示例核对
}

bool kruskal(int n, int m, ll &answer) {
    init(n);
    sort(e, e + m, cmp);
    answer = 0;
    int selected = 0;
    for (int i = 0; i < m && selected < n - 1; ++i) {
        if (!unite(e[i].u, e[i].v)) continue;  // 自环或成环边不选
        answer += e[i].w;
        ++selected;
    }
    return selected == n - 1;  // 不连通时不能把森林的权值当成 MST 答案
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int i = 0; i < m; ++i) {
        cin >> e[i].u >> e[i].v >> e[i].w;
        e[i].id = i;
    }
    ll answer;
    if (kruskal(n, m, answer)) cout << answer << '\n';
    else cout << "orz\n";
    return 0;
}
