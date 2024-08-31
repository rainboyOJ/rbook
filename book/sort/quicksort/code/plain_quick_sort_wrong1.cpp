//quick_sort 思想的最简单的实现
//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-07-02 21:39:06
// 错误原因: 无限递归
// 因为 拆分的子区间的长度,与原区间长度一样 
// 例如: 2 1
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];

//队列的简单实现,
//其实就是数组
struct Que {
    int head;
    int arr[maxn];
    void clear(){ head = 0;}
    void push(int t) { arr[++head] = t; }
    //把数据转到数组a里
    void to_array_a(int start) {
        for(int i = 1 ;i <= head ;++i)
            a[start++] = arr[i];
    }
};

Que q1,q2;

//对数组a,[l,r]区间内数组进行排序
void quick_sort(int l,int r) {
    if( l  >=  r ) return;

    int key = a[l];
    
    //<= key的值放到 q1里
    //> key的值放到 q2里
    q1.clear();
    q2.clear();
    //注意这里是从l+1 开始的
    // 如果是从l开始对不对?
    for(int i =l+1;i<=r ;++i) {
        if( a[i] <= key)
            q1.push(a[i]);
        else
            q2.push(a[i]);
    }
    q1.to_array_a(l);
    q2.to_array_a(l + q1.head);


    quick_sort(l,l+q1.head-1);
    quick_sort(l+q1.head,r);
}

int main (int argc, char *argv[]) {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> a[i];
    }
    quick_sort(1,n);

    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cout << a[i] << " ";
    }
    std::cout  << "\n";

    return 0;
}
