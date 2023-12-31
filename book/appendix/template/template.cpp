#include <bits/stdc++.h>
using namespace std;
// #define DEBUG

#ifdef DEBUG
#define fenc cout << "\n=================\n";

#define log(args...)                             \
    {                                            \
        cout << "LINE:" << __LINE__ << " ";      \
        string _s = #args;                       \
        replace(_s.begin(), _s.end(), ',', ' '); \
        stringstream _ss(_s);                    \
        istream_iterator<string> _it(_ss);       \
        err(_it, args);                          \
        cout << endl;                            \
    }

void err(istream_iterator<string> it) {}
template <typename T, typename... Args>
void err(istream_iterator<string> it, T a, Args... args)
{
    cerr << *it << " = " << a << " ";
    err(++it, args...);
}
#else
#define fenc
#define log(...)
#endif

const int maxn=1e5+5;
int n,m;
int a[maxn];


int main(){
    return 0;
}


