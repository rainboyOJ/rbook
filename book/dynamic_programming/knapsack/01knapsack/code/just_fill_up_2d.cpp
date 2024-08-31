//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-07-13 09:35:56
#include <bits/stdc++.h>
using namespace std;
const int maxn = 100+5;
int n = 5,m  =7;
int w[maxn] = {0,5,3,1,2,4};
int v[maxn] = {0,8,4,3,5,6};
//f[i][j] 表示 
// 前i个物品恰好装满容量j时的最优解
int f[maxn][maxn];

int main (int argc, char *argv[]) {
    //全部设为-1
    memset(f,-1,sizeof(f));
    f[0][0] = 0; //边界

    //枚举物品
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        //枚举容量
        for(int j = 0 ;j<=m;++j)
        {
            f[i][j] = f[i-1][j]; //不选
            if( j < w[i] ||  f[i-1][ j-w[i] ] == -1) continue;
            f[i][j] = max(f[i][j],f[i-1][j-w[i] ] + v[i]);
        }
    }
    std::cout << f[n][m] << "\n";

    return 0;
}
