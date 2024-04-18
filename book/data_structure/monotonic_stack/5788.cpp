/* author: Rainboy email: rainboylvx@qq.com
 * time: 2023年 06月 12日 星期一 16:04:42 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 3e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
/* 定义全局变量 */

int a[maxn]; //每个位置的值
int ans[maxn]; //存答案

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

mystack<int> sta; //创建一个栈



int main(int argc,char * argv[]){

    cin >> n;

    for(int i=1;i<=n;++i) cin >> a[i];

    for(int i=1;i<=n;++i){
        int t = a[i];
        while( !sta.empty() && a[sta.top()] < t){
            // 记录sta.top()位置投影到的位置
            ans[sta.top()] = i;
            sta.pop();
        }
        sta.push(i); //把位置入栈
    };


    //输出答案
    for(int i=1;i<=n;++i) cout << ans[i] << " ";
    std::cout << "\n";

    return 0;
}

