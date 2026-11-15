#include <bits/stdc++.h>
using namespace std;

// 三维教学版：用于 n <= 50 的有向图，要求无负环。
// d[k][i][j]：只允许 1..k 作为中间点时，i 到 j 的最短距离。
// 逐层输出对齐的表格，方便逐层核对。
const int N = 55;
const long long INF = 1000000000000000000LL;
long long d[N][N][N];
int n, m;
int W = 2;                  // 每格统一列宽（保证所有层的表格对齐）
const string INF_TXT = "∞"; // 不可达的显示文本

// 可见宽度：UTF-8 续字节不计，∞ 只占 1 格
int vlen(const string &s) {
    int c = 0;
    for (unsigned char ch : s)
        if ((ch & 0xC0) != 0x80) c++;
    return c;
}

string rpad(const string &s) { return string(W - vlen(s), ' ') + s; }

void print_layer(int k) {
    const string H = "─", V = "│";
    const string TL = "┌", TM = "┬", TR = "┐";
    const string ML = "├", MM = "┼", MR = "┤";
    const string BL = "└", BM = "┴", BR = "┘";
    const int HW = 3;       // 行标题 "i\j" 的宽度

    auto rep = [](const string &s, int c) {
        string r;
        for (int t = 0; t < c; t++) r += s;
        return r;
    };
    auto row = [&](const string &l, const string &mid, const string &r) {
        cout << l << rep(H, HW + 2);
        for (int j = 1; j <= n; j++) cout << mid << rep(H, W + 2);
        cout << r << '\n';
    };

    cout << "D[" << k << "]";
    if (k == 0) cout << "  只允许直接边";
    else        cout << "  允许 {1.." << k << "} 作为中间点";
    cout << '\n';

    row(TL, TM, TR);
    cout << V << " i\\j ";
    for (int j = 1; j <= n; j++) cout << V << " " << rpad(to_string(j)) << " ";
    cout << V << '\n';
    row(ML, MM, MR);

    for (int i = 1; i <= n; i++) {
        cout << V << " " << setw(HW) << right << i << " ";
        for (int j = 1; j <= n; j++)
            cout << V << " " << rpad(d[k][i][j] == INF ? INF_TXT : to_string(d[k][i][j])) << " ";
        cout << V << '\n';
    }
    row(BL, BM, BR);

    // 本层相对上一层被改进的格子，方便对照
    if (k > 0) {
        string chg;
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (d[k][i][j] != d[k - 1][i][j])
                    chg += " (" + to_string(i) + "," + to_string(j) + ")=" +
                           (d[k][i][j] == INF ? INF_TXT : to_string(d[k][i][j]));
        cout << "本层更新:" << (chg.empty() ? " 无" : chg) << '\n';
    }
    cout << '\n';
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n >> m)) return 0;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            d[0][i][j] = (i == j ? 0 : INF);

    for (int t = 0; t < m; t++) {
        int u, v;
        long long w;
        cin >> u >> v >> w;
        d[0][u][v] = min(d[0][u][v], w);
    }

    // 不经过新开放的 k：继承上一层；经过 k：两段距离都从上一层读取。
    for (int k = 1; k <= n; k++) {
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                d[k][i][j] = d[k - 1][i][j];
                if (d[k - 1][i][k] != INF && d[k - 1][k][j] != INF) {
                    d[k][i][j] = min(d[k][i][j],
                                     d[k - 1][i][k] + d[k - 1][k][j]);
                }
            }
        }
    }

    // 先把所有层算完，再按真实数据量出列宽，保证每张表对齐又不过宽
    W = vlen(INF_TXT);
    for (int k = 0; k <= n; k++)
        for (int i = 1; i <= n; i++)
            for (int j = 1; j <= n; j++)
                if (d[k][i][j] != INF)
                    W = max(W, vlen(to_string(d[k][i][j])));

    for (int k = 0; k <= n; k++) print_layer(k);
    return 0;
}
