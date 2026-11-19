#include <bits/stdc++.h>
using namespace std;

const int maxn = 100 + 5;
const int maxdepth = 20;
int n, path[maxdepth];
bool candidate[maxdepth][maxn];

// depth 是已做的加法次数，path[depth] 是当前最大值。
bool dfs(int depth, int limit) {
    if (path[depth] == n) return true;
    if (depth == limit) return false;

    // 即使余下每步都把最大值翻倍，仍到不了 n，则无解。
    int reach = path[depth];
    for (int i = depth; i < limit && reach < n; ++i) reach *= 2;
    if (reach < n) return false;

    // 只对当前前缀的下一项去重；不同深度使用不同数组行。
    fill(candidate[depth], candidate[depth] + n + 1, false);
    for (int i = 0; i <= depth; ++i) {
        for (int j = 0; j <= i; ++j) {
            int x = path[i] + path[j];
            if (path[depth] < x && x <= n) candidate[depth][x] = true;
        }
    }
    // 先尝试较大的值，只改变搜索顺序，不删去较小的合法候选。
    for (int x = n; x > path[depth]; --x) {
        if (!candidate[depth][x]) continue;
        path[depth + 1] = x;
        if (dfs(depth + 1, limit)) return true;
    }
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    while (cin >> n && n) {
        path[0] = 1;
        int limit = 0;
        while (!dfs(0, limit)) ++limit;
        for (int i = 0; i <= limit; ++i) {
            if (i) cout << ' ';
            cout << path[i];
        }
        cout << '\n';
    }
    return 0;
}
