#include <bits/stdc++.h>
using namespace std;

const int maxn = 10;

int n;
int a[maxn];

int chs[maxn]; //选的数
bool vis[maxn]; //第i个数是否被选
void init() {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        std::cin >> a[i];
    }
}


void full_permutation(int dep) {
    if( dep > n) //到达边界
    {
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            cout << chs[i] << " ";
        }
        cout << endl;
        return;
    }
    for(int i =1;i<=n ;i++) {
        if( !vis[i] )
        {
            vis[i] = 1;
            chs[dep] = a[i];
            full_permutation(dep+1);
            vis[i] = 0;
        }
    }

}

int main() {
    init();
    full_permutation(1);
    return 0;
}
