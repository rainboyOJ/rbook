template<typename T=int,int N=maxn>
struct sgt_range {
    T tr[N*4+5];
    T flag[N*4+5]; //flag 里的内容与题目有关，灵活设定
    inline int lp(int p){return p<<1;}
    inline int rp(int p){return (p<<1)|1;}
    inline int mid(int l,int r){return (l+r)>>1;}

    inline void pushup(int p){  //向上合并
        tr[p] = tr[lp(p)] + tr[rp(p)];
    }
    inline void pushdown(int p,int m){ //向下压标记
        if( flag[p] ){ //当前点有flag
            flag[lp(p)] = flag[rp(p)] = flag[p];
            tr[lp(p)] = flag[p]*(m-(m>>1)); //成段替换需要这样写
            tr[rp(p)] = flag[p]*(m>>1);
            flag[p] = 0;
        }
    }

    void build(int l,int r,int p){ //建立
        if( l == r ) {
            scanf("%d",&tr[p]);
            return;
        }
        int m = mid(l,r);
        build(l,m,lp(p));
        build(m+1,r,rp(p));
        pushup(p);
    }

    // 区间更新
    void update(int L,int R,T v,int l,int r,int p){ 
        if(L <= l && r <= R) {
            flag[p] = v; 
            tr[p] = (r-l+1)*v;
            return;
        }
        pushdown(p,r-l+1); //路过
        int m = mid(l,r);
        if( L<=m) 
            update(L,R,v,l,m,lp(p));
        if( R>=m+1)
            update(L,R,v,m+1,r,rp(p));
        pushup(p);
    }

    //区间查询
    T query(int L,int R,int l,int r,int p){
        if( L <=l && r<=R ) {
            return tr[p];
        }
        pushdown(p, r-l+1);
        int m = mid(l,r);
        T ret = 0;
        if( L <= m ) ret+=query(L,R,l,m,lp(p));
        if( R >=m+1) ret+=query(L,R,m+1,r,rp(p));
        //pushup(p);
        return ret;
    }
};
sgt_range<> sgt;
