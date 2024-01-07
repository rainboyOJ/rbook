## 前言

集合是数学的基石,尤其是对研究离散型数据的离散数学来说.

## 相关概念


一般地，我们把研究的对象统称为元素，把一些元素组成的总体叫做集合（简称为集）.
通常用大写的拉丁字母$A,B,C,\cdots$ 表示集合，小写的拉丁字母$a,b,c,\cdots$表示集合中的元素.

常见的数集

- 自然数集:$\mathbb{N}$
- 整数集:$\mathbb{Z}$
- 正整数集:$\mathbb{N_+}$
- 实数集:$\mathbb{R}$
- 有理数集:$\mathbb{Q}$


## 集合中元素的特性

1. 确定性
2. 互异性
3. 无序性

**定义**:集合相等,只要构成两个集合的元素是一样的，我们就称这两个集合相等.

如果$a$是集合$A$的元素,就说$a$**属于**集合$A$,记作$a \in A$;
如果$a$不是集合$A$的元素,就说$a$**不属于**集合$A$,记作$a \notin A$;

## 集合的表示

- 列举法,小于 10 的所有自然数组成的集合,$A = \{0,1,2,3,4,5,6,7,8,9\}$- 描述法,不等式, $x - 7 < 3$的解集合$A = \{x \in R \mid x -7 < 3\}$



## 集合的关系

相等,如果集合$A$中的元素都是$B$中的元素, 且集合$B$中的元素都是$A$中的元素,则称集合$A$与集合$B$相等,写为$A = B$

1. 子集

如果集合$A$中的每个元素都是集合$B$中的元素,可以说$A$是集合$B$的子集,写为$A \subset B$或$B \supset A$

TODO asymptote ven 图

2. 真子集

如果$A \subset B$,且$A \neq B$,则称集合$A$是集合$B$的真子集,写为$A \subseteq B$ 或$B \supseteq A$

如果$A \subset B$,且$\exist x \in B, x \notin B$,则称集合$A$是集合$B$的真子集


空集

没有任何这元素的集合叫空集,写为$\varnothing$


集合元素数量,记为$|A|$

## 集合的操作

并集$A \cup B = \{ x \mid x \in A \text{ or } x \in B\}$

交集$A \cap B = \{x \mid x \in A \text{ and } x \in B\}$


相对补集

绝对补集

对称差集



## 集合恒等式


幂等律

- $A \cup A = A$
 - $A \cap A = A$

交换律

- $A \cup B = B \cup A$
- $A \cap B = B \cap A$

结合律

- $(A \cup B) \cup C = A \cup B( \cup C)$
- $(A \cap B) \cap C = A \cap B( \cap C)$

分配律

- $A \cup (B \cap C) = (A \cup B) \cap (A \cup C)$
- $A \cap (B \cup C) = (A \cap B) \cup (A \cap C)$


德摩根律：

- $\sim(B\cup C)=\sim B\ \cap\sim C$
- $\sim(B\cap C)=\sim B\ \cup\sim C$
- $A-(B\cup C)=(A-B)\cap(A-C)$
- $A-(B\cap C)=(A-B)\cup(A-C)$ 
  
吸收律：

- $A\cup(A\cap B)=A$
- $A\cap(A\cup B)=A$ 
  
零律：

- $A\cup E=E$ 
- $A\cap\varnothing=\varnothing$ 
  
同一律： 

- $A\cup\varnothing=A$ 
- $A\cap E=A$ 
  
排中律： 

- $A\cup{\sim}A=E$ 

矛盾律： 

- $A\ \cap \sim A=\varnothing$ 

余补律： 

- $\sim\varnothing=E$ 
- $\sim E=\varnothing$

双重否定律：

- $\sim\begin{pmatrix}\sim A\end{pmatrix}=A$
 
补交转换律：
 
- $A-B=A\ \cap \sim B$

