//代码模板, 来自 rbook.roj.ac.cn
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

//====== log 调试用
// 使用: int a,b,c; log(a,b,c)
#define fenc cout << "\n=================\n";

#ifdef DEBUG

#define log(args...) { cout << "LINE:" << __LINE__ << " ";string _s = #args; replace(_s.begin(), _s.end(), ',', ' '); stringstream _ss(_s); istream_iterator<string> _it(_ss); err(_it, args); }

void err(istream_iterator<string> it) {}
template<typename T, typename... Args>
void err(istream_iterator<string> it, T a, Args... args) {
	cerr << *it << " = " << a << endl;
	err(++it, args...);
}
#else

#define log(...)

#endif


const int maxn = 1e6+5;
int n,m;
int a[maxn];

//读取数据用
void init() {
    cin >> n;
}

int main () {
    init();

    return 0;
}
