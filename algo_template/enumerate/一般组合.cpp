/*
从n个元素中选m数构成集合,输出所有的集合
4 3
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
void select_combination(int dep,int pre)
{
    if( dep > m) {
        for(int i = 1;i <= m ;++i ) // i: 1->m
        {
            cout << rcd[i] << " ";
        }
        cout << "\n";
        return;
    }
    for(int i = pre+1;i<=n;i++){
        rcd[dep] = a[i];
        select_combination(dep+1,i);
    }

}

int main() {
    std::cin >> n >> m;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> a[i];
    }
    select_combination(1,0);

    return 0;
}
