// 有重复集合排列问题
#include <iostream>
using namespace std;
const int maxn= 1e5+5;
int n,m; //n个原始元素,m个盒子
int cnt;//cnt个不同的元素
int a[maxn]; // 把相同元素放到箱子里 
int rcd[maxn]; //记录选的值

void dfs(int dep) {
    if( dep > m) {//边界,输出
        for(int i =1;i<=m;i++)
            cout << rcd[i] << " ";
        cout << endl;
        return;
    }
    for(int i =1;i<=cnt;i++) {
        if( a[i] > 0) {
            a[i] --;
            rcd[dep] = i;
            dfs(dep+1);
            a[i] ++; //恢复现场
        }
    }
}

int main()
{
    cin >> n >> m;
    for(int i =1;i<=n;i++) {
        int t;
        cin >>t;
        if(a[t] == 0 ) cnt++;
        a[t]++;
    }
    dfs(1);
    return 0;
}
