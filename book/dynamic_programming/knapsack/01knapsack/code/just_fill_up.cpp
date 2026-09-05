//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-07-13 09:35:56
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n = 5,m  =7;
int w[maxn] = {0,5,3,1,2,4};
int v[maxn] = {0,8,4,3,5,6};
int f[maxn];

int main (int argc, char *argv[]) {
    //全部设为-1
    memset(f,-1,sizeof(f));
    f[0] = 0;

    //枚举物品
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        //倒过来枚举容量
        for(int j = m ;j>=w[i];--j)
        {
            if( f[ j-w[i] ] == -1) continue;
            f[j] = max(f[j],f[j-w[i] ] + v[i]);
        }
    }
    std::cout << f[m] << "\n";

    return 0;
}
