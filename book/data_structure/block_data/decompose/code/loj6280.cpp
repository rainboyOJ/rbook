//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-08-17 14:02:48
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
#ifndef DEBUG
#define log(...)
#else
#define log(args...) { cout << "LINE:" << __LINE__ << " : ";string _s = #args; replace(_s.begin(), _s.end(), ',', ' '); stringstream _ss(_s); istream_iterator<string> _it(_ss); err(_it, args); }
void err(istream_iterator<string> it) {}

template<typename T>
void err(istream_iterator<string> it, T a) {
cerr << *it << " = " << a << "\n";
}

template<typename T, typename... Args>
void err(istream_iterator<string> it, T a, Args... args) {
cerr << *it << " = " << a << ", ";
err(++it, args...);
}
#endif
const int maxn = 1e6+5;
int n,m;
ll a[maxn];
ll b[maxn];
ll s[maxn];
int bid[maxn];
int block_size;

int block_id(int p) {
    return (p-1)/block_size   +1;
}

void add(int l,int r,ll v) {
    int lid = bid[l];
    int rid = bid[r];

    if( lid == rid) {
        for(int i = l;i <= r;++i ) // i: lid->rid
        {
            a[i] += v;
            s[lid] += v;
        }

        return;
    }

    // 第一个区间
    for(int i = l;bid[i] == lid;i++) {
        a[i] += v;
        s[lid] +=v;
    }

    // 中间区间
    for(int i = lid+1 ;i < rid;i++) {
        b[i] += v;
        s[i] += block_size * v;
    }

    // 最后一个区间
    for(int i = r; bid[i] == rid;i--) {
        a[i] +=v;
        s[rid] +=v;
    }

}


ll query(int l,int r,int c){
    ll sum = 0;
    int lid = bid[l];
    int rid = bid[r];

    if( lid == rid) {
        for(int i = l ;i <= r;++i ) // i: lid->rid
        {
            sum += a[i] + b[lid];
            sum %= c;
        }
        return sum % c;
    }

    // 第一个区间
    for(int i = l;bid[i] == lid;i++) {
        sum += a[i] + b[lid];
        sum %= c;
    }

    // 中间区间
    for(int i = lid+1 ;i < rid;i++) {
        sum += s[i];
        sum %= c;
    }

    // 最后一个区间
    for(int i = r; bid[i] == rid;i--) {
        sum += a[i] + b[rid];
        sum %= c;
    }

    return sum % c;
}
void print_debug() {
    std::cout << "a[i] : " ;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        std::cout << a[i] << " ";
    }
    std::cout << "\n";

    std::cout << "s[i]: " << "";
    int r = block_id(n);
    for(int i = 1;i <= r ;++i ) // i: 1->r
    {
        std::cout << s[i] << " ";
    }
    std::cout  << "\n";
    std::cout << "b[i]: " << "";
    for(int i = 1;i <= r ;++i ) // i: 1->r
    {
        std::cout << b[i] << " ";
    }
    std::cout << "\n\n\n";

}

int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    std::cin >> n;
    block_size = sqrt(n);
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        std::cin >> a[i];
        bid[i] = block_id(i);
        s[bid[i]] += a[i];
    }
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        int opt,l,r,c;
        std::cin >> opt >> l >> r >> c;
        if( !opt) {
            add(l,r,c);
            // print_debug();
        }
        else
        std::cout << query(l,r,c+1) << "\n";
    }

    return 0;
}
