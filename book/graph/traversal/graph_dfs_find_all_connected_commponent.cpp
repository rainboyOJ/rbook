//dfs遍历图的模板
const int maxn=1e5+5;
struct linklist; //链表存边,这里省略了

int connect_cnt=0; //连通分支编号
bool visted[maxn];
void dfs(int u) {
    visted[u] = connect_cnt;
    for(int i = e(u);i != -1;i=e[i].next){
        int v= e[i].v;
        //遍历过了
        if( visted[v]) continue;
        dfs(v);
    }
}

//找到图的所有的连通分支
void find_all_connect() {
    for(int i =1;i<=n;i++) {
        if( visted[i]) {
            connect_cnt++;
            dfs(i);
        }
    }
}


