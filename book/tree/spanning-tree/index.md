基环树找环算法

无向基环树

内向基环树
外向基环树

```
void dfs_1(int u)
{
    dfn[u] = ++id;
    for(int i=h[u];~i;i=ne[i])
    {
        int j = e[i];
        if(j==pre[u])continue;
        if(dfn[j])
        {
            if(dfn[j]<dfn[u])continue;
            //找到闭环 u可以到达比它大的点
            loop[++cnt] = j;
            for(;j!=u;j=pre[j])loop[++cnt] = pre[j];
            return ;
        }
        else {
      pre[j] = u;
    dfs_1(j);
}
    }
}
```

更简单的思路,https://zhuanlan.zhihu.com/p/570142997

这个算法需要保证运行在,一个连通的内向基环树上来做

回溯法找环


1. 基环树从任意一个点一定能找到环

```cpp
// 找环，存在circle数组中
int find_circle(int u, int fa) {
    if(vis[u]) return u;
    vis[u] = 1;
    for(int i = h[u]; ~i ; i = ne[i]) {
        int j = e[i];
        if(j == fa) continue;
        int t = find_circle(j, u);
        if(t) {
            //vis=2 标记环上的点
            circle[++ top] = u;
            v[top] = w[i]; // 记录边上的权值
            vis[u] = 2;
            return t == u ? 0 : t;
        }
    }
    return 0;
}
```

一个内向基环树的更简单找法，来自: https://usaco.org/current/data/sol_prob1_silver_jan23.html


从一个非连通的图上DAG与spanning tree的组成的图上找，环

原理：

1. 从任意一个点开始向前遍历没有访问的点


```
a   b
|   |
\   |
 \  |
  \ |
   \|
    x
    |
    |
    y
```

原理： 二次遍历法

```cpp
after[100]; // after[i] 表示下一点是哪个点
int vis[100];

bool find_circle(int u) {
    int a = u;
    while( !vis[a]){
      vis[a] = u;
      if( (a == after[a]) == 0) return 0;
    }
    if( vis[a] != u) return 0;

    a = after[u];
    while(1){
      // do somthing to a
      circle[++top] = a;
      if(a == u) break;
      a = after[a];
    }
    return 1;
}

for(int i =1;i<=n;i++) {
  if( !vis[i]) find_circle(i)

}
```





---------------

内向基环树:每个点出度都是1

找到环上的一个点,然后从环上出发就可以找到所有的点
```cpp
// nxt[u] 表示下一个点
void dfs(int u) {
    dfn[u] = ++id;
    if( dfn[nxt[u]] ) mark = u;
    else dfn[]
}
```

外向基环树:每个点入度都是1

反向建图,用内向基树的作法来做.
