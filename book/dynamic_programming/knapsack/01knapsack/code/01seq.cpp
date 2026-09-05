//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-05-03 16:38:43
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;

int w[maxn]; //存物品的重量
int v[maxn];

int b[maxn]; //桶

int ans;

void dfs(int dep) {
    if( dep > n) {
        int tot_w = 0;
        int tot_v = 0;
        cout << "[ ";
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            // cout << b[i] << " ";
            if( b[i] == 0) continue;
            //输出选了那个物品
            cout << i << " ";
            tot_w += w[i];
            tot_v += v[i];
        }
        cout << "] \n ";
        cout << "tot_w: " << tot_w << " ,";
        cout << "tot_v: " << tot_v << "\n\n\n";
        if( tot_w <= m && tot_v > ans)
            ans = tot_v;
        // std::cout << "\n";
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
    std::cin >> m;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> w[i];
        cin >> v[i];
    }
    dfs(1);
    std::cout << ans << "\n";
    return 0;
}
