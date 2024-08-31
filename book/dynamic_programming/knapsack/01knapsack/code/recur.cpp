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

int dfs(int n,int c) {

    if( n == 0 || c == 0)
    {
        return 0;
    }

    // 不放第n个物品
    int t1 = dfs(n-1,c);

    // 放第n个物品
    int t2 = 0;
    if( c >= w[n]) {
        t2 = dfs(n-1,c-w[n]) + v[n];
    }

    if( t1 < t2) t1 =t2;

    cout << "f(" << n << "," << c  << ") = ";
    cout << t1 << endl;
    return t1;
}


int main () {
    std::cin >> n;
    std::cin >> m;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> w[i];
        cin >> v[i];
    }
    ans = dfs(n,m);
    std::cout << ans << "\n";
    return 0;
}


