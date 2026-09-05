/* author: Rainboy email: rainboylvx@qq.com  time: 2020年 12月 05日 星期六 15:51:46 CST */
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
template<typename T=int,int N=maxn>
struct sgt_point {
    T tr[N*4+5];
    inline int lp(int p){return p<<1;}
    inline int rp(int p){return (p<<1)|1;}
    inline int mid(int l,int r){return (l+r)>>1;}

    inline void pushup(int p){
        tr[p] = tr[lp(p)] + tr[rp(p)];
    }

    void build(int l,int r,int p){
        if( l == r ) {
            //scanf("%d",&tr[p]);
            tr[p] = l;
            return;
        }
        int m = mid(l,r);
        build(l,m,lp(p));
        build(m+1,r,rp(p));
        pushup(p);
    }

    void update(int pos,T v,int l,int r,int p){
        if( l == r ) {
            tr[p] += v;
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
        T ret = 0;
        if( L <= m ) ret+=query(L,R,l,m,lp(p));
        if( R >=m+1) ret+=query(L,R,m+1,r,rp(p));
        //pushup(p);
        return ret;
    }

//#ifdef DEBUG
        vector<string> v;
        char fmt[1000];
        string a = "hell";
        int to_dot_cnt;
        void to_dot () {
            v.clear();
            ofstream dot;
            sprintf(fmt,"%04d.dot",++to_dot_cnt);
            dot.open(fmt);
            dot << "graph g{\n node[shape=record];\n";
            _to_dot(1,n,1);
            for (auto& e : v) {
                dot<< e;
            }
            dot<< "}" <<endl;
            dot.close();
        }
        void _to_dot(int l,int r,int p) {
            sprintf(fmt,"%d[label=\"%d|%d|%d\"];\n",p,tr[p],l,r);
            v.push_back(string(fmt));
            if( l == r){
                return ;
            }
            int m = mid(l,r);

            sprintf(fmt,"%d--%d;\n",p,lp(p));
            v.push_back(string(fmt));
            _to_dot(l,m,lp(p));
            sprintf(fmt,"%d--%d;\n",p,rp(p));
            v.push_back(string(fmt));
            _to_dot(m+1,r,rp(p));
        }
//#endif
};
sgt_point<> sgt;

int main(){
    for(int i=1;i<=20;++i){
        n = i;
        sgt.build(1,n,1);
        sgt.to_dot();
    }
    return 0;
}
