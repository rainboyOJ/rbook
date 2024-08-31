//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-07-09 22:47:39
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e3+5;
int n,m;
int w[maxn];
int v[maxn];
int f[maxn]; //一维数组

int main (int argc, char *argv[]) {
    std::cin >> n >> m;

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> w[i] >> v[i];
    }

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        // 遍历 k个 物品,每个物品的重量都是(w_i,v_i)
        for (int k = 1; k * w[i] <= m; k++)
        {
            // 上两行都是在枚举物品

            //倒过来枚举容量
            for(int j = m;j>= w[i];j--) {
                f[j] = max(f[j],f[j-w[i]] + v[i]);
            }
        }
    }
    cout << f[m] <<endl;

    return 0;
}