#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
const int maxm = 500000 + 5;

struct Edge {
    int to, id;
};

vector<Edge> g[maxn];
int indeg[maxn], outdeg[maxn], cur[maxn];
bool used[maxm];
int st[maxm + 1], path[maxm + 1];  // 顶点可重复出现，容量按边数设置
int top = 0, length = 0;

void hierholzer(int s) {
    st[top++] = s;
    while (top) {
        int u = st[top - 1];
        int &i = cur[u];
        while (i < (int)g[u].size() && used[g[u][i].id]) ++i;

        if (i == (int)g[u].size()) {
            path[length++] = u;  // 当前点无出边可走，逆序记录答案
            --top;
        } else {
            auto [v, id] = g[u][i++];
            used[id] = true;
            st[top++] = v;
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;
    for (int id = 0; id < m; ++id) {
        int u, v;
        cin >> u >> v;
        g[u].push_back({v, id});  // 有向边只加入一个方向
        ++outdeg[u];
        ++indeg[v];
    }

    int s = 0, first = 0, starts = 0, ends = 0;
    for (int u = 1; u <= n; ++u) {
        if (outdeg[u] && !first) first = u;
        int delta = outdeg[u] - indeg[u];
        if (delta == 1) {
            ++starts;
            s = u;
        } else if (delta == -1) {
            ++ends;
        } else if (delta != 0) {
            cout << "NO\n";
            return 0;
        }
    }
    // 只能全部平衡，或恰有一对起终点；不能只检查差值是否属于 {-1,0,1}。
    if (!((starts == 0 && ends == 0) || (starts == 1 && ends == 1))) {
        cout << "NO\n";
        return 0;
    }
    if (!s) s = first ? first : 1;

    hierholzer(s);
    if (length != m + 1) {  // 度数条件通过后，检查是否覆盖全部有向边
        cout << "NO\n";
        return 0;
    }
    reverse(path, path + length);
    for (int i = 0; i < length; ++i) {
        if (i) cout << ' ';
        cout << path[i];
    }
    cout << '\n';
    return 0;
}
