/* author: Rainboy email: rainboylvx@qq.com
 * time: 2023年 06月 12日 星期一 16:04:42 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 3e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
/* 定义全局变量 */

int f[maxn];

struct _stack {

    struct node { int v,p; };

    int idx = 0;
    node a[maxn];

    bool empty() { return idx == 0; }

    void push(int v,int p) {
        a[++idx] = {v,p};
    }

    node & top() { return a[idx]; }

    void pop() { idx--; }


    //更新
    void update(int v,int p) {
        while(!empty() && v > top().v ) {
            f[top().p] = p;
            pop();
        }
        push(v, p);
    }
} _sta;

int main(int argc,char * argv[]){
    cin.sync_with_stdio(false);
    cin.tie(0); cout.tie(0);

    cin >> n;

    for(int i=1;i<=n;++i){
        int t;
        cin >> t;
        _sta.update(t, i);
    };
    for(int i=1;i<=n;++i){
        cout << f[i] << " ";
    }
    std::cout << "\n";

    return 0;
}

