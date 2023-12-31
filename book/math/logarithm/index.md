
## 定义

若``a^x = b``,则我们设``log_a^b = x``,读做以``a``为底的``b``的对数为``x``,其中``log``称为对数公式,用来求取一个数``a``的多少次方为``b``

## 基本性质

显然,根据定义得到:


$$
log_a^1 = 0  \tag1
$$

$$
log_a^a = 1  \tag2
$$

$$
log_a^{a^x} = x  \tag3
$$


$$
log_a^{log_a^b} = b  \tag4
$$

## 运算法则

$$log_a^{M \cdot \N} = log_a^M + log_a^N \tag1$$

**Proof:**

$Def$ $x=log_a^M,y = log_a^N,\alpha = log_a^{M \cdot N}$ $then$:

- $a^x = M$
- $a^y = N$
- $a^{\alpha} = M \cdot N$

$$
M \div N = a^x \div a^y = a^{x-y} \\
$$

两边同时取对数

$$
log_a^{M \div N} = log_a^{a^{x-y}} = x-y = log_a^M - log_a^N
$$

**Q.E.D**

-----------------

$$log_a^{M \div N} = log_a^M - log_a^N \tag2$$

$Def$ $x=log_a^M,y = log_a^N,\alpha = log_a^{M \cdot N}$ $then$:

- $a^x = M$
- $a^y = N$
- $a^{\alpha} = M \cdot N$

$$
M \cdot N = a^x \cdot a^y = a^{x+y} \\
$$

**Proof:**

两边同时取对数

$$
log_a^{M \cdot N} = log_a^{a^{x+y}} = x+y = log_a^M + log_a^N
$$



**Q.E.D**

--------

$$log_a^{M^n} = n \cdot log_a^M \tag3 $$

**Proof:**

**Def:** $x = log_a^M$

$$
\begin{aligned}
a^x &= M \\
(a^x)^n &= M ^n \\
a^{x\cdot n} &= M ^n
\end{aligned}
$$

两边现时取对数

$$
log_a^{M ^n} = log_a ^{a^{x\cdot n} }  = x \cdot n = n \cdot log_a^M
$$



**Q.E.D**

-----------
$$
log_a{1 \div N} = 0 - log_a^N = -log_a^N
$$


## 换底公式

```math
\log_{a}^b = \frac{\log_c^b}{\log_c^a}
```

证明:

设``x  = \log_a^b``


```math
x = \log_a^b \rightarrow a^x = b
```

对``a^x = b`` 式子的两边取对数,得到

```math
\begin{matrix}
log_c^{a^x} &=& log_c^b \\
&\rightarrow&  x \cdot log_c^a = log_c^b
\end{matrix}
```

两边同时除以``log_c^a``,得到

```math
\begin{matrix}
x &=& \frac{log_c^b}{log_c^a} \\
\log_a^b &=& \frac{log_c^b}{log_c^a}
\end{matrix}
```

## 推论

TODO
## 题目

最多分解次数为$\lceil log_2^n \rceil$

使用数学归纳法