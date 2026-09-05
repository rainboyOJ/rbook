//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-07-09 22:47:39
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3+5;
int n,m;
int w[maxn];
int v[maxn];
int f[maxn][maxn];

int main (int argc, char *argv[]) {
    std::cin >> n >> m;

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> w[i] >> v[i];
    }

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        for(int j = 1;j <= m ;++j ) // j: 1->m
        {
            //表示一件物品i也不选,可以理解成k=0
            f[i][j] = f[i-1][j];

            //选k件,
            for(int k = 1 ; k*w[i] <= j ;k++) {
                f[i][j] = max(f[i][j],f[i-1][j- k*w[i]] + k*v[i]);
            }
        }
    }
    cout << f[n][m] <<endl;

    return 0;
}