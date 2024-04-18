#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,k;
int a[maxn];

//队列的模板
template<typename T = int,int siz = maxn>
struct myqueue{
    T a[siz+5];
    //tail 指向最后一个元素后面一个位置
    //head 指向第一个元素
    int head = 0,tail=0; 

    void clear() { head =tail = 0;}

    void push(T b) { a[tail++] = b;}

    void pop(){head++;}
    void pop_back(){tail--;}

    T front() { return a[head];}
    T back() { return a[tail-1];}

    bool empty() { return head == tail;}

    int size() { return tail-head;}

    void debug() {
        cout << "queue : ";
        for(int i =  head ;i < tail;i++) {
            cout << a[i] << " ";
        }
        cout << endl;
    }
};

myqueue<int> que;


int main () {
    //读取数据
    std::cin >> n >> k;
    for(int i = 1;i <= n ;++i ) // i: 1->n
        cin >> a[i];
    // 求最小值
    // 1. 先放k个值
    for(int i = 1;i<k;i++) {
        int v = a[i];
        //那些比v的大的都不可能是答案
        while( !que.empty() && a[que.back()] >= v) {
            que.pop_back();
        }
        que.push(i);
    }
    for(int i = k;i<=n;i++) {
        int v = a[i];
        //那些比v的大的都不可能是答案
        while( !que.empty() && a[que.back()] >= v) {
            que.pop_back();
        }
        // 加入 
        que.push(i);
        //删除越界的值
        while( !que.empty() && que.front() < i-k+1)
            que.pop();
        cout << a[que.front()] <<" ";
    }
    cout << endl;

    que.clear();
    for(int i = 1;i<k;i++) {
        int v = a[i];
        //那些比v的小的都不可能是答案
        while( !que.empty() && a[que.back()] <= v) {
            que.pop_back();
        }
        que.push(i);
    }

    // 求最大值
    for(int i = k;i<=n;i++) {
        int v = a[i];
        //那些比v的小的都不可能是答案
        while( !que.empty() && a[que.back()] <= v) {
            que.pop_back();
        }
        // 加入
        que.push(i);
        //删除越界的值
        while( !que.empty() && que.front() < i-k+1)
            que.pop();
        cout << a[que.front()] <<" ";
    }
    cout << endl;

    return 0;
}
