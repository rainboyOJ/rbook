#include <iostream>
using namespace std;
const int maxn = 1e5+5;

int rcd[maxn];
int n,m;

//left 表示剩下的数字是多少
void dfs(int dep,int left) {
    if( dep == m ) //最后一个人,全部拿
    {
        rcd[dep] = left;
        for(int i =1;i<=n;i++)
            cout << rcd[i] << " ";
        cout << endl;
        return;
    }
    for(int i =1;i<=n;i++)
    {
        if( left-i <=0 ) continue;
        rcd[dep] = i;
        dfs(dep+1,left-i);
    }
}

int main()
{
    n = 5; //5个球
    m = 2; //2个盒子
    return 0;
}
