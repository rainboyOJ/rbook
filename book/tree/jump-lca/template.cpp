
//得到最高位1的位置
template<typename T>
int hightBitPos(T n) {
    return ( sizeof(T) *8 - 1 - __builtin_clz(n) );
}


template<typename T>
T log2(T n) {
    return 1<< hightBitPos(n);
}


struct Lca {
    int N,d[maxn],f[maxn][50]; //f[i][j] i点的2^j祖先
    // 初始化，算出的理论跳的最远可能，与f[][]
    inline void init(){
        // for(N=0; (1<<(N+1)) < n ;N++);
        N = hightBitPos(n);
        dfs(1,0,1);
    }

    //树上的遍历来求 f[][] 与d[]每个点的深度
    void dfs(int u,int fa,int dep){
        d[u] = dep;
        f[u][0] = fa;
        // 显示u点到root路径上的点都已经求出来f[][]
        for(int j=1;j<=N;++j) f[u][j] = f[ f[u][j-1] ][j-1];
        for(int i=e.h[u];~i;i=e[i].next){
            int &v = e[i].v;
            if( v == fa) continue; //是父亲 就什么也不做
            dfs(v,u,dep+1);
        }
    }

    //重载(),找到两个点的lca
    int operator()(int a,int b){
        if( d[a] > d[b]) swap(a,b); //保证b是深的点
        for(int i=N;i>=0;--i){ // b 跳到和a一样深
            if( d[ f[b][i] ] >= d[a]) // a深度以下是可行区域,包括a
                b = f[b][i];
        }
        if( a == b) return a; //在同一条链上
     
        for(int i=N;i>=0;--i){ // 同时跳
            if( f[a][i] != f[b][i] ){ //不相同就跳
                a = f[a][i];
                b = f[b][i];
            }
        }
        return f[a][0]; //返回停下来时候的父亲，就是lca
    }

} lca;
