
暂时的模板,后面我会所有的代码整理成一个库 https://github.com:RainboyNoip/minilib

```cpp
#include <bits/stdc++.h>
using namespace std;
#define F(i,s,t) for(int i = s;i<=t;++i)

#define fenc cout << "\n=================\n";

#define log(args...) { cout << "LINE:" << __LINE__ << " ";string _s = #args; replace(_s.begin(), _s.end(), ',', ' '); stringstream _ss(_s); istream_iterator<string> _it(_ss); err(_it, args); }

void err(istream_iterator<string> it) {}
template<typename T, typename... Args>
void err(istream_iterator<string> it, T a, Args... args) {
	cerr << *it << " = " << a << endl;
	err(++it, args...);
}

// ============ 全局变量
const int maxn = 1000005;
const int maxe = 1000005;

int n,m;

// int a[maxn];

// ============ 全局变量 END

//读取数据
void __init(){
    cin >> n; 
    // cin >> m;
}

// 工作
void __work(){

}

// 输出答案
void __print(){

}

int main(){
    // int a=2,b=1,c=3;
    // log(a,b,c);
    __init();
    __work();
    __print();

    return 0;
}

```
