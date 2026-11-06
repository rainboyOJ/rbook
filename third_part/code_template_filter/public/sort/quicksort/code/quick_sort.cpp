//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-24 21:32:12
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];
void print_all() {
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cout << a[i] << " ";
    }
    std::cout << "\n";
}

void debug(int i,int j) {
    print_all();
    cout <<i << " ";
    cout <<j << "\n";
}
//i到j都是有序的
bool check_seq(int s ,int t) {
    for(int i = s+1;i <= t ;++i ) // i: s->t
    {
        if( a[i] > a[i-1] )
            return 0;
    }
    return 1;
}

template<typename F>
bool check_func(int s,int t,F && f) {
    for(int i = s;i <= t ;++i ) // i: s->t
    {
        if( !f(a[i])) 
            return 0;
    }
    return 1;
}


// 核心
int one(int l,int r) {
    int key = a[(l+r) / 2];
    // cout << " key = " << key << endl;

    int i = l-1;
    int j = r+1;

    while(i < j) {
        while( a[--j] > key );
        while( a[++i] < key );
        // debug(i,j);
        // assert(a[i] > a[j]);
        // assert(i < j);


        // i == j 不需要交换,因为指向同一步位置
        // i = j+1 时,交换可能会出错; 数据 1 -1 1 1
        // 只有i<j时一定,需要交换
        if( i < j) std::swap(a[i],a[j]);

        // 证明:
        // 0. 证明: 停止时, i == j or i-1 == j 只有这两种情况 : 核心
        // 1. j所在的位置的左边一定是 pos<=j 一定是 <= key的
        // j 所在的位置的右边一定是 pos > j 一定是>=key

        // 2. i所在的位置的左边不一定是 pos<=j 一定是 <= key的
        // j 所在的位置的右边一定是 pos > j 一定是>=key

        // !!! 还有一个重要的性质:
        // 证明一定不会无限递归
        // 2个元素一定拆成一边一个,也就是说不会一边两个,一边0个,否则会
        // 任意n个元素一定会,拆成的新区间L,R
        // L < n and R < n
        // 那么就可以证明 一定可以到达边界
        // 等价证明 L,R 其中任意一个元素不可能为空集

    }
    assert( check_func(l,j,[key](int v){ return v <= key;}) );
    assert( check_func(j+1,r,[key](int v){ return v >= key;}) );
    return j;
}


void quick_sort(int l,int r) {
    if( l >= r ) return; //边界
    int p = one(l,r);
    // cout << "p = " << p << endl;
    // assert(check(l,p));
    // assert(check(p+1,r));
    quick_sort(l,p);
    quick_sort(p+1,r);
}

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> a[i];
    }
    // print_all();
    // cout << "===" << endl;
    quick_sort(1 , n);
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cout << a[i] << " ";
    }
    std::cout << "\n";


    return 0;
}
