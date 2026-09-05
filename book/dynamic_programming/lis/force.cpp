//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-15 15:22:19
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;

int a[maxn];
int b[maxn]; //桶
//记录答案
int ans;

bool is_lis() {
    //前一个数
    int pre = -9999999;
    for(int i =1;i<=n;i++) {
        if( b[i] == 1) {
            if( a[i] < pre)
                return false;
            pre = a[i];
        }
    }
    return true;
}

void print_seq() {
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        if( b[i]) cout << a[i] << " ";
    }
    std::cout << "\n";
}

void dfs(int dep) {
    if( dep > n) {
        int cnt = 0;
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            cnt += b[i];
        }
        if( cnt > ans && is_lis())
        {
            ans = cnt;
            //调试用,输出这个序列
            // print_seq();
        }
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
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> a[i];
    }
    dfs(1);
    std::cout << ans << "\n";
    return 0;
}


