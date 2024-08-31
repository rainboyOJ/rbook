//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-01 17:48:24
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3+5;
int n,m;
int a[maxn][maxn];
//f[i][j] 表示从(i,j)向下走,能得到的最大值
int f[maxn][maxn];
int ans;
int cnt;


int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        for(int j = 1;j <= i ;++j ) // j: 1->i
        {
            cin >> a[i][j];
        }
    }
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        //初始化最后一层的数据,边界
        f[n][i] = a[n][i];
    }

    //层数倒过来
    for(int i=n-1;i>=1;i--){
        //处理这一层的所有的值
        for(int j = 1;j <=i;j++)
            f[i][j] = max(f[i+1][j+1],f[i+1][j]) + a[i][j];
    }
    //输出答案
    cout << f[1][1] << endl;

    return 0;
}
