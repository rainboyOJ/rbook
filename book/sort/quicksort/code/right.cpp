//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-24 22:02:14
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        std::cin >> a[i];
    }
    sort(a+1,a+1+n);
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cout << a[i] << " ";
    }
    std::cout  << "\n";

    return 0;
}
