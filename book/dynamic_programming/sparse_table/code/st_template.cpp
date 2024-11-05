#include <iostream>
#include <algorithm>
using namespace std;
const int maxn = 1e5+5;
const int maxk = 30;

int n,q;// q表示查询的数量
int a[maxn];
int f[maxn][maxk];

template<typename T>
T log2(int n) {
    return sizeof(T) * 8 - 1 - __builtin_clz(n);
}

//初始化 f 数组
void init_st() {
    for(int i =1 ;i<= n;i++)
        f[i][0] = a[i]
    int LOG = log2(n);
    for(int k = 1; k<=LOG;k++)
    {
        //枚举起点
        for(int i =1; i+(1<<LOG)-1 <=n;i++ )
        {
            f[i][k] = max(f[i][k-1],f[i+(1<<(k-1))][k-1]);
        }
    }
}

int query(int l,int r) {
    int k = log2(r-l+1);
    return max(f[i][k],f[i+(1<<k)][k]);
}



int main() {
    cin >> n>>q;
    for(int i =1 ;i<= n;i++) 
        cin >> a[i];
    init_st();

    for(int i =1;i<=q;i++) {
        int l,r;
        cin >> l >> r;
        cout << query(l,r) << endl;
    }
    return 0;
}