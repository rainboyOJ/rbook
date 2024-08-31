## 核心

::: oneWordAlgo
x以根的子树,除了x不满足,其它的结点都满足,对于整个tree都是满足的,那么就要调整x
:::



## 二叉堆

什么是二叉堆,一个满足如下性质的树$T$

1. $T$是完全二叉树
2. 任意一个节点的权值都小于等于其父亲的权值,$min(lson,rson) \leqslant father$

推论

整个子树上的所有点都小于x(x是子树上的点)(原因:具有大于小于传递性)

因为$T$是完全二叉树,所以满足

1. $p(root) = 1$
1. $p(lson) = 2\times p(father)$
2. $p(rson) = 2\times p(father)+1$
3. $p(father) = \lceil p(lson) \div 2 \rceil = \lceil p(rson) \div 2 \rceil$


```
int lson(int t) { return t<<1;}
int rson(int t) { return (t<<1)|1;}
int fa(int t) { return t>>1;}
```



支持的操作: 增删查

- 不支持改,如果需要改,那就先把对应的元素删除,然后重新添加

### 增 insert

在数组的末尾添加一个元素,然后通过向上交换的方式进行调整,直到整个树重新满足二叉堆的性质

证明整个过程是正确的,使用数学归纳法

设点x表示需要交换的节点





- 在交换的过程,点$x$为根的子树tree(x)是满足性质的
- 

第一次,x没有孩子$fit(tree(x))成立$

且交换后,x比father(x) better,那么x比father(x)另一个孩子也better,

所以交换后$fit(tree(x))$成立,且$ exclude_tree(x)$在整个树上也满足heap的性质,这就保证后面x再进行交换,x的位置变成为新的更高的节点,也是满足的


```
```


### 删 remove

核心: 两个孩子l,r之间的最优值经fa还优,那么就可以交换,交换后就变成一个新的子树上的问题,(新的子树整体上还是对于新的交换上去的root,还是满足性质的)

替换在位置p上的值,可能向上调整,也可以向下(证明TODO)

### 查 top

### 创建二叉堆

1. 先创建一个空的堆
2. 然后不停止的"增"元素


## 模板代码


```cpp
<%- include("./heap.cpp")%>
```


