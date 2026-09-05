//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-01 17:48:24
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3+5;
int n,m;
int a[maxn][maxn];
int rcd[maxn]; //记录走过的点的值
int ans;
int cnt;

void dfs(int x,int y) {
    //记录下来这个点
    rcd[x] = a[x][y]; 

    //到达边界
    if( x == n) {
        int sum = 0;
        cnt++;
        // cout << cnt << " : ";
        //求走过的点的和
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            sum += rcd[i];
            // cout << rcd[i] << " ";
        }
        // std::cout << "\n";
        //记录最大值
        if( ans < sum) ans = sum;
        return ;
    }
    //向左走
    dfs(x+1,y);
    //向右走
    dfs(x+1,y+1);
}

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        for(int j = 1;j <= i ;++j ) // j: 1->i
        {
            cin >> a[i][j];
        }
    }
    dfs(1,1);
    std::cout << ans << "\n";

    return 0;
}
