//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-05-03 17:22:44
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];
int ans;

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        std::cin >> a[i];
    }

    //枚举以i为结尾
    for(int i = 2;i <= n ;++i ) // i: 1->n
    {
        // 枚举对应的起点
        for(int j = 1;j <= i-1 ;++j ) // j: 1->i
        {
            if( a[j] != a[i])
                ans++;
        }
    }
    std::cout << ans << "\n";

    return 0;
}
