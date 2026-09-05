## 素数定义

定义1: 我们把仅有两个正因数的正整数叫做素数，不是素数又不是1的正整数叫做合数

定义2: 除了1和它本身以外，不存在其它的正因数的数的正整数叫做素数，不是素数又不是1的正整数叫做合数


## 素数判断

根据定义写出一个朴素的判断素数的函数

```cpp
bool isprime(int n){
    if( n ==1 ) return 0;
    for(int i =2;i<n;i++){
        if(n%i==0) return 0;
    }
    return 1;
}
```

优化:

设命题$p(n)$表示,整数$n$是一个素数
命题$q(n)$,存在两个正整数$x,y,x \leqslant y$且$x \neq 1 \land y \neq 1$,使得$n = x \cdot y$

显然$p(n) \Leftrightarrow q(n)$,两者是等价命题

显然$x$的取值范围是$[2,\sqrt{n}]$,

显然$\exist x ( \in [2,\sqrt{n}] \land x \in \mathbb{N} ) \land y \in \mathbb{N} \to x \cdot y = n \Leftrightarrow \neg p(n)$

所以我们只需要检测是否存在这样的整数$x$,就能判断这个数字$n$是否是素数

```cpp
bool isPrime(int n){
    if( n == 1) return 0;
    for(int i =2;i*i <= n;i++)
        if( n%i == 0) return 0;
    return 1;
}
```

## 埃氏筛

例3找出1一100中的全部素数.
解：只需把1与1~100之间的合数去掉即可.而对于1~100之间的每个合数a,它
一定能被某个不超过√a的素数整除，从而能被不超过√100=10的素数整除.我们知道，
不超过10的素数为2，.3,5,7.在1~100中首先去掉1，然后分别去掉2,3,5,7除自
身以外的倍数，最后剩下的数就是不超过100的全部素数.具体做法如下表：


$$
\begin{array}{cccccccccc}
\bcancel{1} & \boxed{2} & \boxed{3} & \bcancel{4} & \boxed{5} & \bcancel{6} & \boxed{7} & \bcancel{8} & \bcancel{9} & \bcancel{10}\\
\boxed{11} & \bcancel{12} & \boxed{13} & \bcancel{14} & \bcancel{15} & \bcancel{16} & \boxed{17} & \bcancel{18} & \boxed{19} & \bcancel{20}\\
\bcancel{21} & \bcancel{22} & \boxed{23} & \bcancel{24} & \bcancel{25} & \bcancel{26} & \bcancel{27} & \bcancel{28} & \boxed{29} & \bcancel{30}\\
\boxed{31} & \bcancel{32} & \bcancel{33} & \bcancel{34} & \bcancel{35} & \bcancel{36} & \boxed{37} & \bcancel{38} & \bcancel{39} & \bcancel{40}\\
\boxed{41} & \bcancel{42} & \boxed{43} & \bcancel{44} & \bcancel{45} & \bcancel{46} & \boxed{47} & \bcancel{48} & \bcancel{49} & \bcancel{50}\\
\bcancel{51} & \bcancel{52} & \boxed{53} & \bcancel{54} & \bcancel{55} & \bcancel{56} & \bcancel{57} & \bcancel{58} & \boxed{59} & \bcancel{60}\\
\boxed{61} & \bcancel{62} & \bcancel{63} & \bcancel{64} & \bcancel{65} & \bcancel{66} & \boxed{67} & \bcancel{68} & \bcancel{69} & \bcancel{70}\\
\boxed{71} & \bcancel{72} & \boxed{73} & \bcancel{74} & \bcancel{75} & \bcancel{76} & \bcancel{77} & \bcancel{78} & \boxed{79} & \bcancel{80}\\
\bcancel{81} & \bcancel{82} & \boxed{83} & \bcancel{84} & \bcancel{85} & \bcancel{86} & \bcancel{87} & \bcancel{88} & \boxed{89} & \bcancel{90}\\
\bcancel{91} & \bcancel{92} & \bcancel{93} & \bcancel{94} & \bcancel{95} & \bcancel{96} & \boxed{97} & \bcancel{98} & \bcancel{99} & \bcancel{100}\\

\end{array}
$$
因此不超过100的素数为2,3,5,7,11,13,17,19,23,29,31,37,41,43，
47,53,59,61,67,71,73,79,83,89,97,共25个.这种寻找索数的方法叫做埃
拉托斯特尼(Eratosthenes)。
筛法

## 欧拉筛

TODO