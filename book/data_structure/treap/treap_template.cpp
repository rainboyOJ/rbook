const int maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

struct Random {
    random_device rd;
    mt19937 engine{rd()};
    uniform_int_distribution<> dis;
    Random(){}
    Random(int l,int r){ dis = uniform_int_distribution<> (l,r); }
    int operator()(){ return dis(engine); }
};

struct Treap {
    typedef struct { int val,fix,sz,cnt,c[2];} node;
    node tr[maxn];
    Random rnd;
    int root,idx=0,top=0,s[maxn];
    inline int &lc(int p){ return tr[p].c[0];}
    inline int &rc(int p){ return tr[p].c[1];}
    inline int &c(int p,int i){ return tr[p].c[i];}
    inline int &fix(int p){return tr[p].fix;}
    inline int &sz(int p){return tr[p].sz;}
    inline int &cn(int p){return tr[p].cnt;}
    inline int &va(int p){return tr[p].val;}

    // 建立一个新的节点
    inline void New(int &p,int v){
        tr[p = ++idx] = {v,rnd(),1,1,{0,0}};
    }
    // 向上更新
    inline void pushup(int p){
        sz(p) = sz(lc(p)) + sz(rc(p)) + cn(p);
    }

    // aim == 0 把左孩子给提上来 表示右旋 
    // aim == 1 把右孩子给提上来 表示左旋
    void rotate(int &p,bool aim){
        int t = c(p,aim);       //t 对应的孩子
        c(p,aim) = c(t,!aim);   //指向孩子的反孩子
        c(t,!aim) = p;          //孩子的反孩子指向自己
        pushup(p);pushup(t);    //更新
        p = t;                  //指向新的根
    }

    //插入
    void _ins(int &p,int v){
        if( !p ) {
            New(p,v);
            return;
        }
        sz(p)++;
        if( va(p) == v) cn(p)++;
        else {
            bool aim = v> va(p);
            _ins(c(p,aim),v);
            if( fix(c(p,aim)) < fix(p) ) //孩子的fix值比自己小
                rotate(p, aim);
        }
    }
    void ins(int v){
        _ins(root,v);
    }

    //删除
    void _del(int &p,int v){
        if( !p) return;
        if(va(p) == v){
            if( cn(p) > 1) cn(p)--,sz(p)--;
            else if(!lc(p) || !rc(p) ) p = lc(p) +rc(p); //只有一个孩子存在
            else { //两个孩子都存在
                //把小的那个孩子提上来,自己下去了
                rotate(p, fix(lc(p)) < fix(rc(p))); 
                _del(p,v);//把提上来的点 sz--
            }
        }
        else {
            sz(p)--;
            _del(c(p,v>va(p)),v);
        }
    }
    void del(int v){ _del(root,v);}

    // 排名
    // 每一次向右走，排名都会增加
    // 边界1: va(p) != p 但已经不向下走了，
    //          还要加上lc(p)的数量
    //          如果va(p) < v 还加上cn(p)
    // 边界2: va(p) == v 还要加上lc(p)的数量
    int Rank(int v){ //得到v的排名
        int p = root , ans = 1;
        while( va(p) != v && c(p,v>va(p)) ){
            if( v > va(p)) ans += sz(lc(p)) + cn(p);
            p = c(p,v > va(p));
        }
        return ans + sz(lc(p)) + ( va(p) < v ? cn(p) : 0);
    }
    // 得到排名为k的值
    // 排名树的数量是 sz(lc(p))
    // 排名为k的数在左子树上： sz(lc(p)) >= k
    // 排名为k的数在右子树上： sz(lc(p)) + cn(p) < k
    // 排名为k的数在当前点上： 不满足上面的两个条件
    int at(int k){
        int p = root;
        while( p ){
            if( sz(lc(p)) >= k ) p = lc(p);
            else if ( sz(lc(p)) + cn(p) < k)
                k -= sz(lc(p)) + cn(p), p = rc(p);
            else break; }
        return p;
    }
    // pre  前趋
    // 得到v的排名k
    // 得到排名为k-1的数
    // 1 2 2 2 5
    // 1 2     5
    // rank(5) == rank(4) == rank(3)
    // at(rank(5-1)) = 5
    inline int pre(int v){
        return va(at(Rank(v)-1));
    }
    // next 后继
    // 得到的v+1的排名，
    // 1 2 2 2 5
    // 1 2     5 rank 显然应该Rank(v+1)
    // rank(2)+1 = 5
    // rank(3)+1 = 6
    // rank(4)+1 = 6
    // Rank(2) = 2 Rank(3) = 5 at(Rank(2)+1) = 2
    inline int next(int v){
        return va(at(Rank(v+1)));
    }
} treap;

