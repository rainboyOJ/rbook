//简化版本
#include <bits/stdc++.h>
using namespace std;

const int maxn = 1e5+5;

int n; //个数
int m; // 离散化后的个数
int a[maxn]; // 存需要离散化的数
int b[maxn]; // 存散化后的数

//返回离散化的元素的数量
//对a进行离散化
int discrete(int a[],int n) {
    int cnt = 0;
    sort(a+1,a+1+n); //从小到大排序
    for(int i =1;i<=n;i++) {
        if( i == 1 || a[i] != a[i-1])
            b[++cnt] = a[i];
    }
    return cnt;
}

//执行一下 int m = discrete(a,n);

//查找x对应的离散化后的数
int query(int x) {
    int idx = std::lower_bound(b+1,b+1+m,x) - b;

    //如果确实是这个值,返回对应的下载
    if( b[idx] == x) return idx;
    return m+1; // 表示没有找到
}
