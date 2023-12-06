## 入门 : A Simple Problem with Integers

疑问: 分块后,如何维护每个块的区间和信息呢?不仅可以得到整块的区间和,还可以得到块的局部和.

如果修改只会针对整块,那只需要一个**增量标记$add[i]$**,表示第i块加上的数值

那么查询就是``\sum\limits_{l_i}{r_i}a[i] + add[i] \times (r_i-l_i+1)``,``\sum\limits_{l_i}{r_i}``,此
时为定值,所以整个查询的复杂度为``O(1)``

为了避免每一次都暴力查询原区间和,设``sum[i] = \sum\limits_{l_i}{r_i}a[i]``

如果查询的区域有块的局部区域(连续)呢?比如查询第i块内的``[x,y]``

```math
\sum\limits_{x}{y}a[i] + add[i] \times (y-x+1)
```

如果修改的区域有块的局部区域(连续)呢?比如修改第i块内的``[x,y]``的值加上``b``
显然也要修改``sum[i] = (y-x+1) \times b``,因为``sum[i]``与块区间和一一对应.

此时我们暴力我去修改``[x,y]``.复杂度为$O(y-x+1)$

## 如何分块,分块中的数学

```
7=> sqrt(7) = 2

[1 2][3 4][5 6 7]

```

长度为n的序列按``sqrt(n)``,可以分成``n / sqrt(n)``个整块




> 大段维护,局部朴素

核心: 对于第$i$个块来说

- 它的**整个**和为 : ``sum[i] + add[i] \times length[i]``
- 它的一部分$[l,r]$和为: ``add[i] \times (r-l+1) + \sum\limits_{i=l}{r}a[i]``


## 代码实现

```cpp
/**
* author: Rainboy email: rainboylvx@qq.com
* time: 2023年 06月 12日 星期一 09:58:40 CST
*/
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
const int maxn = 1e6+5,maxe = 1e6+5; //点与边的数量

int n,m;
/* 定义全局变量 */
ll sum[maxn];
ll a[maxn];

//分块的模板
struct split_chunk {
    ll * arr = a; //对应的原数组
    int chunk_id[maxn]; //每个点属于的chunk编号
    int per_chunk_length; // 每个chunk的长度
    int chunk_tot; // 共有多少个chunk
    ll add[maxn];

    int l[maxn],r[maxn]; //l[i],第i块的左区间

    //通过数组的长度,来创建相关的信息
    void init(int n) {
        per_chunk_length = sqrt(n);
        chunk_tot = per_chunk_length;
        for(int i=1;i<=chunk_tot;++i){
            l[i] = (i-1) * per_chunk_length + 1;
            r[i] = i * per_chunk_length;
        }
        //
        if(r[chunk_tot] < n)
        {
            ++chunk_tot;
            l[chunk_tot] = r[chunk_tot-1]+1;
            r[chunk_tot] = n;
        }

        // 得到位置i对应的chunk_id
        for(int i=1;i<=chunk_tot;++i){
            for(int j=l[i];j<=r[i];++j){
                chunk_id[j] = i; //每个位置j对应的chunk_id
                sum[i] += a[j]; //预先处 分块的区间和
            }
        }
    }

    void part_update(int l,int r,ll d) {
        int cid = chunk_id[l];
        for(int i=l;i<=r;++i){
            a[i] += d;
        }
        sum[cid] += d * (r-l+1);
    }
    ll part_query(int x,int y){
        int cid = chunk_id[x];
        ll ans = 0;
        for(int i=x;i<=y;++i){
            ans += a[i];
        }
        ans += add[cid] * (y -x+1);
        return ans;
    }

    //更新连续区间
    void update(int x,int y,ll d) {
        int u = chunk_id[x],v =chunk_id[y];
        if(u == v) {
            part_update(x, y, d);
        }
        else {
            for(int i=u+1;i<=v-1;++i){
                add[i] += d;
            }
            part_update(x, r[u], d);
            part_update(l[v], y, d);
        }

    }

    //查询区间和
    ll query(int x,int y) {
        int u = chunk_id[x],v =chunk_id[y];
        ll ans = 0;
        if(u == v) {
            ans += part_query(x, y);
        }
        else {
            for(int i=u+1;i<=v-1;++i){
                ans += sum[i] + add[i] * (r[i] - l[i] +1);
            }
            ans += part_query(x, r[u]);
            ans += part_query(l[v], y);
        }
        return ans;
    }

} chunk;

void init()
{
    // cin >> n >> m;
    scanf("%d%d",&n,&m);
    for(int i=1;i<=n;++i){
        // cin >> a[i];
        scanf("%lld",&a[i]);
    }
}
int main(int argc,char * argv[]){
    // cin.sync_with_stdio(false);
    // cin.tie(0);
    // cout.tie(0);
    init();
    chunk.init(n);

    char str[3];
    int l,r,d;
    for(int i=1;i<=m;i++) {
        // cin >> q;
        scanf("%s",str);
        scanf("%d%d",&l,&r);
        if( str[0] == 'C') {
            cin >> d;
            chunk.update(l, r, d);
        }
        else {
            // cout << chunk.query(l, r) << "\n";
            printf("%lld\n",chunk.query(l, r));
        }
    }

    return 0;
}
```



