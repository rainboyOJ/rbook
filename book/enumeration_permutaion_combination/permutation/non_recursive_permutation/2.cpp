#include <bits/stdc++.h>
using namespace std;
const int maxn = 100;


int n,m; //n个球,m个盒子
int rcd[maxn]; // 记录,rcd[1]=2,表示小朋友人选了球2
int vis[maxn]; // vis[i] 表示 球i被选走了,被使用了

void permutation(int dep) {
    if( dep > m ) { //注意改了这里
        //输出选的球
        for(int i =1;i<=m;i++) //注意改了这里
            cout << rcd[i] << " ";
        cout << endl;
        return;
    }
    for(int i = 1;i<=n;i++){
        if(vis[i]) continue; //球i被选了,就略过
        rcd[dep] = i;
        vis[i] = 1; //记录这球i被选
        permutation(dep+1); //下一个小朋友去选
        vis[i] = 0;// 放回这个球, 恢复现场
    }
}

int main (int argc, char *argv[]) {
    n = 4;
    m= 3;
    permutation(1);
    return 0;
}
