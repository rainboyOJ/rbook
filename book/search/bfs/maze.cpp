#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <utility>
using namespace std;

const int maxn = 1000 + 5; // 地图边长上限，按题目范围调整
string grid[maxn];
int dist[maxn][maxn];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    for (int i = 0; i < n; ++i) cin >> grid[i];
    int sx, sy, tx, ty;
    cin >> sx >> sy >> tx >> ty;
    --sx; --sy; --tx; --ty; // 题面从 1 编号，数组从 0 编号

    for (int i = 0; i < n; ++i) fill(dist[i], dist[i] + n, -1);
    queue<pair<int, int>> q;
    dist[sx][sy] = 0;
    q.push({sx, sy});
    const int dx[] = {-1, 1, 0, 0};
    const int dy[] = {0, 0, -1, 1};
    while (!q.empty()) {
        auto [x, y] = q.front();
        q.pop();
        for (int k = 0; k < 4; ++k) {
            int nx = x + dx[k], ny = y + dy[k];
            if (nx < 0 || nx >= n || ny < 0 || ny >= n) continue;
            if (grid[nx][ny] == '1' || dist[nx][ny] != -1) continue;
            dist[nx][ny] = dist[x][y] + 1; // 入队之前就确定距离、完成判重
            q.push({nx, ny});
        }
    }
    cout << dist[tx][ty] << '\n'; // 通用约定：不可达输出 -1
}
