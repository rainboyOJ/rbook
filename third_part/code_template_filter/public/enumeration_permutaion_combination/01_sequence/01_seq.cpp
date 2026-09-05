//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-05-03 16:38:43
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;

int b[maxn]; //桶
void dfs(int dep) {
    if( dep > n) {
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            cout << b[i] << " ";
        }
        std::cout << "\n";
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
    dfs(1);
    return 0;
}
