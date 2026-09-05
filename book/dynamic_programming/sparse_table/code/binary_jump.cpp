#include <iostream>
using namespace std;
const int maxn = 1e5+5;
const int maxk = 50; //这里为什么取50,因为足够大

int f[maxn][maxk]; //定义dp数组

int n; //区间总长度
int q; // q个query
int a[maxn]; //原始数组

void init_st() {
    //边界
    for(int i=1; i<=n; i++) f[i][0] = a[i];

    // 枚举长度
    for (int k = 1; k <= maxk; k++)
    {
        //枚举起点
        // 这里i+(1<<k) 表示 以i为起点的长度为2^k的区间 的右端点
        // [------ ][there]
        // 这里这样写是为了防止越界
        for (int i = 1; i+(1<<k) <= n+1 ;i++) {
            f[i][k] = max(f[i][k - 1], f[i + 1 << (k - 1)][k - 1]);
        }
    }
}

template<typename T>
T highbit(int n) {
    return sizeof(T) * 8 - 1 - __builtin_clz(n);
}

// 在新数据上位置p是否可达
bool can_reach(int pos,int end) {
    if( pos > n) return  0;
    return pos <= end;
}

//新位置上的点x到跳转2^j
int max_val(int x,int j) {
    return f[x+1][j];
}

//查询 区间的最值,进行binary jump
int query(int l,int r) {
    int start = l - 1; //在新数据上的起点
    int maxk = highbit(n);

    int ans  = a[l]; //初始化ans,为第一个值
    for(int k = maxk;k>=0;k--) {
        int new_pos = start + (1<<k);
        if( can_reach(new_pos,r) )
        {
            ans = max(ans,max_val(start,k));
            start += (1<<k);
        }
    }
    return ans;
}


int main(int argc, char const *argv[])
{
    //读取数据
    cin >> n >> q;
    for(int i =1;i<=n;i++) {
        cin >> a[i];
    }
    init_st();
    for(int i =1;i<=q;i++) {
        int l,r;
        cin >>l>> r;
        cout << query(l,r);
    }
    return 0;
}
