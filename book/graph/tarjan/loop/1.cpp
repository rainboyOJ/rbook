#include <iostream>
#include <cstring>
using namespace std;

const int maxn = 1e6+5;
const int maxe = 1e6+5;
int n,m;

struct linkList {
    typedef struct {int u,v,w,next;} edge;
    edge e[maxe];
    int h[maxn],edge_cnt=0;
    linkList(){
        edge_cnt=0;
        memset(h,-1,sizeof(h));
    }

    //遍历点u 周围点
    template<typename U>
    void for_each(int u,U func){
        for(int i = h[u] ; i !=-1;i = e[i].next)
            func(e[i].u,e[i].v,e[i].w); //u v w
    }

    void add(int u,int v,int w=0){
        e[edge_cnt] = {u,v,w,h[u]};
        h[u] = edge_cnt++;
    }
    void add2(int u,int v,int w=0){
        add(u,v,w);
        add(v,u,w);
    }
    //下标访问
    edge& operator[](int i){ return e[i]; }
    //返回head[u]
    int operator()(int u){ return h[u]; }
} e;

//读取数据
void init() {
    std::cin >> n >> m;
    for(int i=1;i<=m;++i){
        int u,v;
        std::cin >> u >> v;
        e.add2(u,v);
    }
}

int dfn[maxn];
bool node_color[maxn]; //标记环上的点
bool edge_color[maxe]; // 标记环上边
                       //

int fa[maxn]; //每个点的父子边

//找环上的点与边
//u是dfn大的点
void get_cycle(int u,int v,int c) {
    edge_color[c] = 1;
    node_color[u] = 1;
    node_color[v] = 1;

    while( u != v) {

        u = e[fa[u]].u;
        node_color[u] = 1;
    }

}


int timestamp; // idx
//dfs 序查找 环上的点与边
void dfs(int u,int father) {
    dfn[u] = ++ timestamp;
    for(int i = e.h[u]; ~i;i= e[i].next) {
        int v = e[i].v;
        if( v == father) continue;
        if( !dfn[v]) { //没有访问过
            fa[v] = i; //记录父子边
            dfs(v,u);
        }
        else if ( dfn[v] < dfn[u])
            get_cycle(u, v,i);
    }
}

int main(){
    init();
    dfs(1,0);

    //输出环上的点
    for(int i=1;i<=n;++i){
        cout << " node "<< i <<"  in loop : ";
        if(node_color[i])
            std::cout << "yes\n" ;
        else
            std::cout << "no\n" ;
    }

    return 0;
}
