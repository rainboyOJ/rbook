/* author: Rainboy email: rainboylvx@qq.com  time: 2020年 12月 19日 星期六 16:49:34 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
template<typename T,int N = maxn>
struct sgt_range {
    T tr[N*4+5],f[N*4+5]; // 表示如果有标记，f表示对应的节点里的标记值是什么
    bool flag[N*4+5]; //0 没有标记，1有标记
    inline int lp(int p)        { return p<<1;     }
    inline int rp(int p)        { return (p<<1)|1; }
    inline int mid(int l,int r) { return (l+r)>>1; }

    inline void pushup(int p){
        tr[p] = tr[lp(p)] + tr[rp(p)];
    }
    inline void pushdown(int p,int len){
        if( flag[p]){
            flag[lp(p)] = flag[rp(p)] = 1;
            f[lp(p)] = f[rp(p)] = f[p];
            tr[lp(p)] = f[p]*(len - (len>>1));
            tr[rp(p)] = f[p]*(len>>1);
            f[p] = 0;
            flag[p] = 0;
        }
    }

    void build(int l,int r,int p){
        if( l == r ) {
            scanf("%d",&tr[p]);
            return;
        }
        int m = mid(l,r);
        build(l,m,lp(p));
        build(m+1,r,rp(p));
        pushup(p);
    }

    void update(int L,int R,T v,int l,int r,int p){
        if(L <= l && r <= R) {
            flag[p] = 1;
            f[p] = v;
            tr[p] = (r-l+1)*f[p];
            return;
        }
        pushdown(p, r-l+1);
        int m = mid(l,r);
        if( L<=m) 
            update(L,R,v,l,m,lp(p));
        if( R >=m+1)
            update(L,R,v,m+1,r,rp(p));
        pushup(p);
    }

    T query(int L,int R,int l,int r,int p){
        if( L <=l && r<=R ) {
            return tr[p];
        }
        pushdown(p, r-l+1);
        int m = mid(l,r);
        T ret = 0;
        if( L <= m ) ret+=query(L,R,l,m,lp(p));
        if( R >=m+1) ret+=query(L,R,m+1,r,rp(p));
        return ret;
    }
};
sgt_range<int> sgt;

int main(){
    scanf("%d",&n);
    sgt.build(1, n, 1);
    scanf("%d",&m);
    for(int i=1;i<=m;++i){
        char o[10];
        scanf("%s",o);
        if( o[0] == 'c'){
            int x,y,z;
            scanf("%d%d%d",&x,&y,&z);
            sgt.update(x, y, z, 1, n, 1);
        }
        else {
            int x,y;
            scanf("%d%d",&x,&y);
            int ans = sgt.query(x,y,1,n,1);
            printf("%d\n",ans);
        }
    }
    return 0;
}
