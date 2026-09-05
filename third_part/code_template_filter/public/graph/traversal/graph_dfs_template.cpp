//dfs遍历图的模板
const int maxn=1e5+5;
struct linklist; //链表存边,这里省略了

bool visted[maxn];
void dfs(int u) {
    visted[u] = 1;
    for(int i = e(u);i != -1;i=e[i].next){
        int v= e[i].v;
        //遍历过了
        if( visted[v]) continue;
        dfs(v);
    }
}


