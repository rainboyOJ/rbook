/* author: Rainboy email: rainboylvx@qq.com  time: 2023年 06月 12日 星期一 21:21:31 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const ll maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

ll n,m;
/* 定义全局变量 */


struct _stack {
    struct node {
        ll h,w;
    };
    node a[maxn];
    ll idx = 0;
    ll ans = 0;

    void init() {
        idx = 0;
        ans = 0;
    }
    bool empty() {
        return idx == 0;
    }

    void push(ll v) {
        ll w = 0; // 已经弹出的矩形的总宽度
        while( !empty() && top().h > v ) {
            //删除比现在高的柱形
            w += top().w; //每删除一个柱形,自己
            ll area = w * top().h; // 删除的柱形能和左边的形成的面积
            ans = max(area,ans);
            pop();
        }
        a[++idx] = {v,w+1};
    }

    node & top() {
        return a[idx];
    }

    void pop() {
        idx--;
    }

} _sta;

int main(){
    cin.sync_with_stdio(false);
    cin.tie(0); cout.tie(0);

    while(1) {
        cin >> n;
        if( n == 0 ) break;
        _sta.init();
        for(ll i=1;i<=n;++i){
            ll t;
            std::cin >> t;
            _sta.push(t);
        }
        _sta.push(0);
        std::cout << _sta.ans << "\n";
    }
    
    return 0;
}

