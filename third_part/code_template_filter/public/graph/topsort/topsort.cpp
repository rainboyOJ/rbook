//linklist

linklist<int> e;
queue<int> que;

int in_deg[maxn]; //每个点的入度

//存topsort的结果
int ta[maxn];
int ta_cnt;

void topsort() {
    // 把入度为0的点加入队列里
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        if( in_deg[i] == 0) q.push(i);
    }

    //队列不空
    while( !q.empty())
    {
        int u = q.front();
        q.pop();
        //放到结果队列里
        ta_cnt++;
        ta[ta_cnt] = u;

        for(int i = e.h[u]; ~i;i = e.e[i].next) 
        {
            int v = e.e[i].v;
            --in_deg[v];
            if( in_deg[v] == 0) q.push(v);
        }
    }
}
