#include <bits/stdc++.h>
using namespace std;
const int maxn=1005;

//手动初始化数据
int n,m; // n表示物品个数,m表示背包容量
int w[maxn];  //每个物品的重量
int v[maxn];  //每个物品的价值

//清空置零,同时前0个物品,边界,f[0][j]=0
int f[maxn][maxn];

void Knapsack01(){
    int i,j;
    for(i=1;i<=n;i++)//前i个物品
        for(j=1;j<=m;j++){
            f[i][j] = f[i-1][j]; //先不放第i个物品
            
            //如果能放下第i个物品,就看放进入后
            //价值是不是变得更大
            if( j-w[i] >=0 ){ // 在容量j的条件下能放进去
                if(f[i][j] < f[i-1][j-w[i]]+v[i])
                    f[i][j] = f[i-1][j-w[i]]+v[i];
            }
        }
}
int main(){
    //读取数据
    cin>>n>>m;
    for(int i=1;i<=n;i++)
        cin >> w[i] >> v[i];
    Knapsack01();
    printf("%d",f[n][m]);//输出答案
    return 0;
}