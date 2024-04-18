#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,k;
int s[maxn]; //前缀和
int ans = -2147483648; // 最小的负数

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
    //前缀和
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cin >> s[i];
        s[i] += s[i-1];
    }
    que.push(0); //加入一个前缀和s[0]
    // 求最小值
    for(int i = 1;i<=n;i++) {
        //删除越界的值
        while( !que.empty() && que.front() < i-k)
            que.pop();

        ans = max(ans,s[i]- s[que.front()]);

        int v = s[i];
        //为了保证不会减去自己s[i],所以在计算完之后才添加s[i]
        //那些比v的大的都不可能比v更好
        while( !que.empty() && s[que.back()] >= v) {
            que.pop_back();
        }
        // 加入 
        que.push(i);
    }
    cout << ans << endl;
    return 0;
}

