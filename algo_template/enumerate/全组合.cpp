/*
全组合,有多种实现方式
- 二进制子集枚举
- for循环枚举数字,二进制01编码
- 更改一般组合
4
1 2 3 4

原理,定序唯一性
*/

#include <iostream>
using namespace std;
const int maxn = 10+5;
int n,m;
int a[maxn];

int rcd[maxn];
bool vis[maxn];


//pre ,上一个选的元素的位置
void full_combination(int dep,int pre)
{
    //一进入递归,就输出
    // 原理,每个组合的子集都是组合
    // 树上行走,每个点都可以是边界
    for(int i = 1;i < dep ;++i ) // i: 1->m
    {
        cout << rcd[i] << " ";
    }
    cout << "\n";

    for(int i = pre+1;i<=n;i++){
        rcd[dep] = a[i];
        full_combination(dep+1,i);
    }

}

int main() {
    std::cin >> n >> m;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> a[i];
    }
    full_combination(1,0);

    return 0;
}
