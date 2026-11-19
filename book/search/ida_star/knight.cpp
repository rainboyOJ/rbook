#include <bits/stdc++.h>
using namespace std;

char board[5][5];
const char goal[5][6] = {
    "11111", "01111", "00*11", "00001", "00000"
};
const int dx[8] = {1, 1, -1, -1, 2, 2, -2, -2};
const int dy[8] = {2, -2, 2, -2, 1, -1, 1, -1};

// 只统计非空棋子；一次交换至多让一枚错位棋子归位。
int estimate() {
    int h = 0;
    for (int i = 0; i < 5; ++i) {
        for (int j = 0; j < 5; ++j) {
            if (board[i][j] != '*' && board[i][j] != goal[i][j]) ++h;
        }
    }
    return h;
}

// (x,y) 是当前空位；(px,py) 是上一次空位，用于避免立即走回头路。
bool dfs(int x, int y, int px, int py, int depth, int limit) {
    int h = estimate();
    if (depth + h > limit) return false;
    if (h == 0) return true;  // 本题中 h=0 恰好意味着整个棋盘已到达目标

    for (int i = 0; i < 8; ++i) {
        int nx = x + dx[i], ny = y + dy[i];
        if (nx < 0 || nx >= 5 || ny < 0 || ny >= 5) continue;
        if (nx == px && ny == py) continue;
        swap(board[x][y], board[nx][ny]);
        bool found = dfs(nx, ny, x, y, depth + 1, limit);
        swap(board[x][y], board[nx][ny]);  // 无论成功与否，都恢复棋盘
        if (found) return true;
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int T;
    cin >> T;
    while (T--) {
        int x = -1, y = -1;
        for (int i = 0; i < 5; ++i) {
            for (int j = 0; j < 5; ++j) {
                cin >> board[i][j];
                if (board[i][j] == '*') x = i, y = j;
            }
        }
        int answer = -1;
        for (int limit = estimate(); limit <= 15; ++limit) {
            if (dfs(x, y, -1, -1, 0, limit)) {
                answer = limit;
                break;
            }
        }
        cout << answer << '\n';
    }
    return 0;
}
