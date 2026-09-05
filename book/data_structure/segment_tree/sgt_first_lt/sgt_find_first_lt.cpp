//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-09-22 15:25:16
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
int a[maxn];
const int inf = 0x7f7f7f7f;

int bucket[maxn];
int cnt = 0; //线段树build时,用来读取bucket的下标计数器

template<typename T,int N = maxn>
struct sgt_point {
    T tr[N*4+5];
    inline int lp(int p)        { return p<<1;     }
    inline int rp(int p)        { return (p<<1)|1; }
    inline int mid(int l,int r) { return (l+r)>>1; }

    inline void pushup(int p){
        // tr[p] = tr[lp(p)] + tr[rp(p)];
        //求最小值
        tr[p] = std::min(tr[lp(p)] , tr[rp(p)]);
    }

    void build(int l,int r,int p){
        if( l == r ) {
            // scanf("%d",&tr[p]);
            tr[p] = bucket[++cnt];
            return;
        }
        int m = mid(l,r);
        build(l,m,lp(p));
        build(m+1,r,rp(p));
        pushup(p);
    }

    void update(int pos,T v,int l,int r,int p){
        if( l == r ) {
            // tr[p] += v;
            tr[p] = v;
            return;
        }
        int m = mid(l,r);
        if( pos<=m) 
            update(pos,v,l,m,lp(p));
        else 
            update(pos,v,m+1,r,rp(p));
        pushup(p);
    }

    T query(int L,int R,int l,int r,int p){
        if( L <=l && r<=R ) {
            return tr[p];
        }
        int m = mid(l,r);
        int a =inf,b =inf;
        if( L <= m ) a=query(L,R,l,m,lp(p));
        if( R >=m+1) b=query(L,R,m+1,r,rp(p));
        //pushup(p); 因为没有更改，所以不需要
        return min(a,b);
    }
    void debug(int l,int r,int p) {
        log(l,r,p,tr[p]);
        if(l == r) return;
        int m = mid(l,r);
        debug(l,m,lp(p));
        debug(m+1,r,rp(p));
    }
};
sgt_point<int> sgt;

// 0 表示这个数出现的位置是n+1

int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    int x = 123;
    log(x);
    std::cin >> n >> m;
    memset(bucket,0x7f,sizeof(bucket));
    int ma = -1;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        int t ;
        std::cin >> t;
        if(bucket[t] == inf) {
            bucket[t] = i;
        }
        if( ma == -1 || ma < t)
            ma = t;
    }

    cnt = 0;
    //线段树的建立
    sgt.build(1,ma,1);
    sgt.debug(1,ma,1);


    // 注意 m - 1 可能是0
    if( m - 1 == 0) {
        std::cout << n+1 << "\n";
        return 0;
    }

    int pos = sgt.query(1,m-1,1,ma,1);
    if( pos == inf)
        std::cout << n+1 << "\n";
    else
        std::cout << pos << "\n";


    return 0;
}
