

可持久化线段树,以称为函数式线段树,叫函数式线段树的原因,应该和函数式编程的核心数据结构`bitmapped vector trie`有关.

核心思想:当我们对sgt进行单点修改的时候,只会使用``nlog(n)``个点发生改变

操作过程:
当我们进行单点修改的时候,对于更新的节点p,它一定是被``lc,rc``之一改变的,也就是其中的一个孩子不变,我们为改变的那个孩子创建一个新的节点,然后在创建的新的节点是继续操作,最后会得到一个`logn`节点的链,这个链附属在原sgt上,如下图所示

图TODO


持久化sgt难以使用区间修改

可以使用标记永久化+持久化sgt 完成 HDOJ 4348 TO the moon

核心(增量记忆): 比普通的线段树多了一个`udpate_history`操作

题目:

- luogu P3919 neopcs Ok
- luogu P3834
- poj 2104 K-th number

常用的解决的问题

## 参考

- [线段树，从入门到入坑 - AcWing](https://www.acwing.com/blog/content/36266/)
