
template<typename T>
inline void min_upd(T & a , const T & b) {
    if( a < b ) a = b;
}

template<int N>
struct trajan_cut {
    int dfn[N],low[N];
    bool cut[N];
    int _rt; // root 点的编号
    linkList * _e; //linklist的指针
    int idx = 0;

    void init() {
        idx = 0;
        memset(dfn,0,sizeof(dfn));
        memset(low,0,sizeof(low));
        memset(cut,0,sizeof(cut));
    }

    bool is_cut(int u) const {
        return cut[u];
    }

    void dfs(int u,int fa) {
        int ch = 0; // 孩子的数量
        low[u] = dfn[u] = ++idx;

        //非叶子结点会进入下面的循环
        for(int i = e.h[u] ; ~i ;i = e[i].next) {
            int v = e[i].v;
            if( v == fa) continue; //不走父子边
            if( !dfn[v] ) { //没有访问过
                dfs(v,u);
                min_upd(low[u], low[v]); //用孩子边来更新自己
                if( u== _rt) ch++; //更新孩子

                //有一个孩子无法"超越"自己
                if(u != _rt && low[v] >= dfn[u])
                    cut[u] = 1;
            }
            else // 访问过的点
                min_upd(low[u], low[v]) ; //通过回边更新自己

        }

        //退出这个点
        if( u == _rt && ch > 1)
            cut[u] = 1;

    }

    void work(int root,linkList & arg = e) {
        _e = &args;
        _rt = root;
        dfs(root,-1);
    }
};
