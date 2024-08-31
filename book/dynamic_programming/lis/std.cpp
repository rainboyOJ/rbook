//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-15 17:45:14
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];

//f[i] 表示以第i个元素为结尾的最长lis长度
// 边界 f[1] = 1
int f[maxn];
int ans;

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> a[i];
    }
    f[1] = 1;

    //从第2个元素开始
    for(int i = 2;i <= n ;++i ) // i: 2->n
    {
        int t = 0;
        for(int j = 1;j < i ;++j ) // j: 1->i
        {
            if( a[j] <= a[i] && t < f[j])
                t = f[j];
        }
        f[i] = t + 1;
    }
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        if( ans < f[i])
            ans = f[i];
    }
    cout << ans;
    
    return 0;
}
