#include <bits/stdc++.h>
using namespace std;

const int maxn = 200000 + 5;
vector<int> g[2][maxn];  // 0：原图；1：反图
int dis[2][maxn], q[2][maxn];
int head[2], tail[2];

// 队列中尚未处理的节点恰好是一层；只扩展这一层。
int expand(int side) {
    int end = tail[side], answer = INT_MAX;
    while (head[side] < end) {
        int u = q[side][head[side]++];
        for (int v : g[side][u]) {
            if (dis[side][v] != -1) continue;
            dis[side][v] = dis[side][u] + 1;
            q[side][tail[side]++] = v;
            if (dis[side ^ 1][v] != -1) {
                answer = min(answer, dis[side][v] + dis[side ^ 1][v]);
            }
        }
    }
    return answer;
}

int bfs(int s, int t) {
    memset(dis, -1, sizeof(dis));
    head[0] = head[1] = tail[0] = tail[1] = 0;
    dis[0][s] = dis[1][t] = 0;
    q[0][tail[0]++] = s;
    q[1][tail[1]++] = t;
    if (s == t) return 0;

    while (head[0] < tail[0] && head[1] < tail[1]) {
        // 选择较小的整层，不能只取一个节点就重新选择方向。
        int side = (tail[0] - head[0] <= tail[1] - head[1]) ? 0 : 1;
        int answer = expand(side);
        if (answer != INT_MAX) return answer;
    }
    return -1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, s, t;
    cin >> n >> m >> s >> t;
    while (m--) {
        int u, v;
        cin >> u >> v;
        g[0][u].push_back(v);
        g[1][v].push_back(u);  // 原图 u -> v，反图 v -> u
    }
    cout << bfs(s, t) << '\n';
    return 0;
}
