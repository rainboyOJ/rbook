//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-07-09 22:47:39
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3+5;
int n,m;
int w[maxn];
int v[maxn];
int f[maxn];

int main (int argc, char *argv[]) {
    std::cin >> n >> m;

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> w[i] >> v[i];
    }

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        for(int j = w[i];j <= m ;++j ) // j: 1->m
        {
            f[j] = max(f[j],f[j-w[i]] +v[i]);
        }
    }
    cout << f[m] <<endl;

    return 0;
}
