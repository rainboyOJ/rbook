/*
对输入的n个数进行全排列,显然可以使用更简章的STL next_permutation,
但这里使用递归实现

3
1 2 3

*/

#include <iostream>
using namespace std;
const int maxn = 10+5;

int n; //共有多少个数
int a[maxn]; //读取的数据

int rcd[maxn] ;  // 记录 每个位置上的数
bool vis[maxn]; //每个数是否使用

void full_permutation(int dep) {
    if( dep > n) {
        //输出
        for(int i = 1;i<=n;i++)
            cout << rcd[i] << " ";
        cout << "\n";
        return ;
    }

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        if( vis[i] == 0) {
            vis[i] = 1;
            rcd[dep] = a[i];
            full_permutation(dep+1);
            vis[i] = 0; //恢复现场
        }
    }
}


int main() {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        std::cin >> a[i];
    }
    full_permutation(1);

    return 0;
}
