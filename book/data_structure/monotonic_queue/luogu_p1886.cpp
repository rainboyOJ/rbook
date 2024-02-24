/* author: Rainboy email: rainboylvx@qq.com
 * time: 2023年 06月 12日 星期一 22:07:16 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
/* 定义全局变量 */
int __a[maxn];

void init()
{
    cin >> n >> m;
}

struct _queue {
    int head= 0,tail=0;

    struct node {
        int v,p;
    };
    node a[maxn];
    int ans;

    bool empty() { return tail == head; }


    void _push(int v,int p) { a[tail++] = {v,p};}
    int size() { return tail-head;}
    void pop_front() { ++head;}
    void pop_back() { --tail;}
    node & front() { return a[head];}
    node & back() {return a[tail-1];}

    template<typename F>
    void push(int v,int pos, F && f) {
        while( !empty() && f(back().v, v))
            pop_back();
        _push(v, pos);
    }

    //删除前面<p的部分
    void del(int p) {
        while( !empty() && front().p < p)
            pop_front();
    }
} que1,que2;

int main(int argc,char * argv[]){
    cin.sync_with_stdio(false);
    cin.tie(0); cout.tie(0);

    init();

    que1.ans = -2147483648; //求max
    que2.ans = 0x7fffffff; // 求min

    for(int i=1;i<=n;++i){
        cin >> __a[i];
    }

    for(int i =1 ;i<= n;i++) {
        int t = __a[i];
        que1.push(t, i, std::greater<int> {});
        if( i >=m) {
            que1.del(i-m+1);
            cout << que1.front().v << " ";
        }
    }
    std::cout << "\n";

    for(int i =1 ;i<= n;i++) {
        int t = __a[i];
        que2.push(t, i, std::less<int> {});
        if( i >=m) {
            que2.del(i-m+1);
            cout << que2.front().v << " ";
        }
    }
    std::cout << "\n";


    return 0;
}

