//Author by [Rainboy](https://github.com/rainboylvx)
//date: 2024-12-5 10:28
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5;
const int maxe = 1e6+5;

int n,m;
int dfn[maxn],low[maxn]; // dfn: 访问序号  low: 能退回的最早序号
bool vis[maxn];          // 是否访问过
bool in_sta[maxn];       // 是否在栈内
int _time;               // 访问计时器
int color_idx;           // 强连通分量个数
int color[maxn];         // color[i]: 点 i 属于哪个强连通分量

//图的存储结构,linkList
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

template<typename T = int,int siz = maxn>
struct mystack{
    T sta[siz+5];
    int head = 0;

    void clear() { head = 0;}

    void push(T a) { sta[head++] = a;}

    void pop(){head--;}

    T top() { return sta[head-1];}

    bool empty() { return head == 0;}

    int size() { return head;}
};
mystack sta; //栈


//读取数据
void init(){
    std::cin >> n >> m;
    for(int i = 1;i <= m ;++i ) // i: 1->m
    {
        int u,v;
        std::cin >> u >> v;
        e.add(u,v);
    }
}

void dfsscc(int u) {
    vis[u] = 1;
    dfn[u] = low[u] = ++_time;
    sta.push(u); //入栈
    in_sta[u] = 1;
    for(int i = e(u);i != -1 ;i= e[i].next)
    {
        int v = e[i].v;
        if( vis[v] == 0)
        {
            dfsscc(v);

            //孩子能通过返祖边到的最早祖先,更新自己
            low[u] = min(low[u],low[v]);
        }
        else if( in_sta[v] )
        {
            // 一条返祖边
            low[u] = min(low[u],dfn[v]);
        }
    }
    //退出点u时，进行检查
    if( low[u] == dfn[u]) { // 回不到更早点
        //设定点u为根的子树上的点强连通的编号
        int t;
        color_idx++;
        do {
            t = sta.top();
            sta.pop();
            in_sta[t] = 0;
            color[t] = color_idx;
        }while( t != u);
    }
}



int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    init();
    for(int i =1;i<=n;i++)
    {
        if( vis[i] == 0) //如果没有访问过
            dfsscc(i);
    }
    //输出每个点的强连通编号
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        cout << "node " << i << ": " << color[i] << endl;
    }
    return 0;
}
