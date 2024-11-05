@[toc]

## 问题引入

如果我们有一段区间[1,n],我们需要不停的操作某一段区间里的值,还要不停的查询?怎么做最快?


- [hdu1166 敌兵布阵](https://vjudge.net/problem/HDU-1166#author=0)


上面这一个题目是一个很好的**线段树**入门的题目.在做一这一个题目之前,我们来了解一下线段树的一些相关性质.


## 性质

**注意看图**:这个图中包含了线段树的精华,记住这个图就能学会线段树

![1](/images/线段树1.png)


如图,我们有一段[1,10]的区间,每个值就是自己的下标值,我们把[1,10]区间每次按一半的原则分割,可以看到以下的性质.

**性质1:下标关系**

设rt为父结点下标,lson(rt)为左孩子下标,rson(rt)为右孩子下标,那么

```c
lson(rt) = rt*2;
rson(rt) = rt*2+1;
```
当然我们也可以这样写,速度更快

```c
inline int lson(rt){ return rt <<1; }
inline int rson(rt){ return (rt<<1)|1; }
// 注意一定要有括号, << 没有 |的优先级高
```

**性质2:叶子结点**

我们发现从左到右的每个叶子结点代表区间内的一个值,且所代表的区间就是原下标值(l == r)


**性质3:每个结点所代表的值**

仔细看图,会发现每个结点有两个值,1:当前下标,2:所代表的区间,当所代表的区间的左值==右值的时候,这个点就是叶子结点

### 思考与练习

**1. 如何拆分区间**

显然每个节点有这几个属性，代表的区间的范围`[l,r]`，下标`rt`，设`m=(l+r)/2`，那么

 - 左孩子的区间是`[l,m]`，下标`lson(rt)`
 - 右孩子的区间是`[m+1,r]`，下标`rson(rt)`
 - 如果拆分到一个节点的区间`l==r`，那就到达叶子结点了，不需要再拆分了

**2. 如何更新叶子结点**

如果想要更新一个叶子结点的值，也就是原线段上的一个单点的值，怎么做？利用$dfs$的思想，根据叶子结点属于左子树，还是右子树来决定每一次走哪个孩子，最终到达叶子结点的时候就是要更新的点，然后直接更新。具体看代码。

**3. 如何更新父结点**

在更新完叶子结点后，在$dfs$回溯的到父亲结点$u$的时候，此时$u$在左右孩子都已经更新完毕，所以可以利用此时左右孩子的值来更新$u$的值。

想要掌握好上面的性质,自己找5个例子,用纸和笔摸拟:

## 基本操作与数据

 - tree[]数组来存树
 - maxn是给的区间大小,那tree[]要开到大于maxn的最小$2^x$倍
 - rt代表当前结点的值
 - lson(rt),rson(rt)得到rt的孩子的下标
 - pushup(rt)利用tree[lson(rt)],tree[rson(rt)]来更新tree[rt]的值

```c
inline int lson(int rt){ return rt <<1; }
inline int rson(int rt){ return (rt<<1)|1;}
#define maxn 1000
int tree[maxn*4+5]; //开4倍空间

void pushup(int rt){
    /* 不同的题目有不同的写法 */
    tree[rt] = tree[lson(rt)] +tree[rson(rt)];
}
```

::: info
[为什么开4倍空间](https://blog.csdn.net/mmww1994/article/details/104206072#commentBox)
:::

[1到20长度的线段树生成程序](./code/1-20sgt-generate.cpp)


## 建树 

如果要建树: 1:一定写成递归,2.每一次分割成两半,3:边界是叶子结点(l==r)

```c
void pushup(int rt){
    //用左右孩子来更更新当前点
    tree[rt] = tree[lson(rt)] + tree[rson[rt]];
}
void build(int l,int r,int rt){
    if(l == r){
        scanf("%d",&tree[rt]);//按dfs的顺序,叶结点从左到右的顺序读取
        return;
    }
    int m =(l+r)>>1;
    build(l,m,lson(rt)); //递归建立左子树
    build(m+1,r,rson(rt));//递归建立右子树
    pushup(rt);//更新当前点
}
```


## 线段树的单点更新

想一想,我们维护一个简单的线段树需要哪些操作:

 - build 首先要建立一个树,才能在树上操作
 - query 完成某段区间的查询操作
 - update 更新某个点,并且更新的时候最好把它一系列祖先都给更新了

**单点更新**

```c
void update(int pos,int add,int l,int r,int rt){
    if(l == r){
        tree[rt] += add;
        return;
    }
    int m = (l+r)>>1;
    /* 这样不停的尝试,最的停下的叶子结点一写是poss*/
    if(pos <=m ) update(pos,add,l,m,lson(rt));
    else update(pos,add,m+1,r,rson(rt));
    pushup(rt);
}
```

**区间查询:**

只要我们所在的区间a,被要找的区间b包含就可以直接返回值了

```c
int query(int l1,int r1,int l,int r,int rt){
    if(l1 <= l && r <=r1){
        return tree[rt];
    }
    int m =(l+r)>>1;
    int ret = 0;
    if(l1 <=m ) ret+=query(l1,r1,l,m,lson(rt));
    if(r1 >m ) ret+=query(l1,r1,m+1,r,rsson(rt));
    return ret;
}
```

## 代码模板

<!-- template start -->
```c
<%- include("template/sgt_point.cpp") %>
```
<!-- template end -->

## 手动练习

当你可以快速的手算出答案，你就变强了

 - 数据生成 [:arrow_down: data1.py](./code/data1.py)
   将会生成如下格式的数据
   1. 第一行$n$，$m$表示n个数据，m个的询问
   2. n个数
   3. 询问
    - $1,x,y$点$x$加$y$
    - $2,x,y$查询区间$[x,y]$的和
 - 暴力程序，输出答案，用来验证[:arrow_down: check1.cpp](./code/check1.cpp)
 - 线段树程序[:arrow_down: 1.cpp](./code/1.cpp)

下载上面的程序，手动模拟建立Sgt，计算，直到你觉得完全熟悉为止。

## 题目代码

- roj hdu-1166(可能没有上传)


## 练习题目

TODO

