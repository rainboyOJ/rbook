template<typename T,int N = maxn>
struct sgt_point {
    T tr[N*4+5];
    inline int lp(int p)        { return p<<1;     }
    inline int rp(int p)        { return (p<<1)|1; }
    inline int mid(int l,int r) { return (l + r) / 2; }

    inline void pushup(int p){
        tr[p] = tr[lp(p)] + tr[rp(p)];
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
        if (r < L || R < l) return 0;
        if (L <= l && r <= R) return tr[p];
        int m = mid(l,r);
        T ret = query(L,R,l,m,lp(p)) + query(L,R,m+1,r,rp(p));
        return ret;
    }
};
sgt_point<int> sgt;
