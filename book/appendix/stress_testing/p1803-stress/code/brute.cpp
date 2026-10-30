// brute.cpp —— 标准答案: 01 序列
// b[i] = 0 表示不参加第 i 场, b[i] = 1 表示参加第 i 场
#include <bits/stdc++.h>
using namespace std;
const int maxn = 20; // 对拍时 n <= 8

int n;
int ans = 0;
int L[maxn], R[maxn]; // 第 i 场比赛的开始 / 结束时间
int b[maxn];          // 01 序列

// 检查当前的 01 序列是否合法: 任意两场被选中的比赛都不能冲突
bool check() {
    for(int i = 1;i <= n ;++i ) {
        if( b[i] == 0) continue;
        for(int j = i+1;j <= n ;++j ) {
            if( b[j] == 0) continue;
            // 首尾相接不算冲突, 只有真正重叠才算
            if( L[i] < R[j] && L[j] < R[i]) return false;
        }
    }
    return true;
}

// dep: 现在决定第 dep 场比赛选不选
void dfs(int dep) {
    if( dep > n) {
        if( !check() ) return;
        int cnt = 0;
        for(int i = 1;i <= n ;++i ) // i: 数一数选了几场
            cnt += b[i];
        ans = max(ans,cnt);
        return;
    }
    for(int i = 0;i <= 1 ;++i ) // i: 0->1
    {
        b[dep] = i;
        dfs(dep+1);
    }
}

int main () {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
        std::cin >> L[i] >> R[i];
    dfs(1);
    std::cout << ans << "\n";
    return 0;
}
