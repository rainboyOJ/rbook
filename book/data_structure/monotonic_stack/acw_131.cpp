/* author: Rainboy email: rainboylvx@qq.com
 * time: 2023年 06月 12日 星期一 21:21:31 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

ll n,m;
ll a[maxn];
/* 定义全局变量 */

//栈的模板
template<typename T = int,int siz = maxn>
struct mystack{
    T sta[siz+5];
    int head = 0;

    void clear() { head = 0;}

    void push(T a) { sta[head++] = a;}

    void pop(){head--;}

    T top() { return sta[head-1];}

    bool empty() { return head == 0;}

    int size() { return head;}
};

struct node {
    ll h; //高度
    ll w; //宽度
};

//求矩形a的面积
ll area(node &a) {
    return a.h * a.w;
}

mystack<node> sta; //创建一个栈

int main(){

    while(1) {
        cin >> n;
        ll ans = -1;

        if( n == 0 ) break;
        sta.clear(); //清空栈
        for(int i = 1;i <= n ;++i ) // 读取数据
            cin >> a[i];
        for(int i=1;i<=n;++i){
            node t = {a[i],1};

            //把比当前高的都删除
            while(!sta.empty() && sta.top().h >= t.h )
            {
                t.w += sta.top().w;
                sta.pop();
            }
        }

        //清空sta里的值
        std::cout << ans << "\n";
    }
    return 0;
}

