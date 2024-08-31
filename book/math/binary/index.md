[[TOC]]

## 学习路线

```viz-dot
digraph G {
    ranksep=1;
    node[shape="rect"];
    1[label="STL <bitset>"]
    2[label="原生位操作"]
    x[label="状态压缩",fillcolor=lightblue,style=filled]
    {1,2}->x->{3,4};
    3[label="状压DP",style=dashed]
    4[label="状压线段树",style=dashed]
}
```

关于$STL$的中$<bitset>$,请查看**语法篇**

## 知识网络

```viz-dot
digraph G {
    //ranksep=1;
    rankdir=LR;
    node[shape="rect"];
    1[label="基本运算"];
    ">>"
        "<<"
        "|"->"1 | x = 1\n0 | x = x"
        "&"->"1 & x = x\n0 & x = 0"
        "^"->"1 ^ x = ~x\n0 ^ x = x"
        "~";

    1->"某位置0"
    1->"某位置1"
    1->"得到1的数量"
    1->"保留最低位的1:lowbit"
    1->"子集枚举:(A-1)&A"
    1->"得到一个连续1的数字(1<<n)-1"

}
```

## 二进制基础运算


**常用位运算符:**

| 运行符     | 名称     |
|------------|----------|
| `>>`       | 右移     |
| `<<`       | 左移     |
| `& `       | 按位与   |
| `|`        | 按位或   |
| `^ `       | 按位异或 |
| `~ `       | 按位取反 |

注意位运算的优先级都很低

### 右移特点

```c
1010 >> 1  = 101
1011 >> 1  = 101
```

 - 任何数右移一位相当于除以2:

```c
(n >> 1) == (n/2)
```

### 左移特点

```
1 << 0 = 1
1 << 1 = 10
```

二进制的最低位我们叫第$0$位,`1<<k`,就是把$1$放到第$k$位


 - 任何数左移一位相当于乘以2:

```c
(n << 1) == (n * 2)
```

### 按位与特点

```
1 & 0 =0
0 & 1 =0
```

 - 任何数与$0$按位与都是$0$

```
1 & 1 = 1
0 & 1 = 0
```

 - 任何数与$1$按位与都是原来的数

**所以你可以利用这个特点来对特定位置的数时行置$0$**
```c
#include <cstdio>
#include <cstring>

/* num:数   len:长度*/
char s4_pbin[40];
char * p_bin(int n,int len){
    memset(s4_pbin,'0',sizeof(s4_pbin));
    s4_pbin[len+1] = '\0';

    while(n && len){
        s4_pbin[len--] = (n & 1)+'0';
        n >>=1;
    }
    return s4_pbin+1;
}
#define print_bin4(i)               printf("%s", p_bin(i,4))
#define print_bin8(i)               printf("%s", p_bin(i,8))
#define print_bin16(i)              printf("%s", p_bin(i,16))
#define print_bin32(i)              printf("%s", p_bin(i,32))


int main(){
    int a = 0b1111;
    printf("a = %d\n",a);
    print_bin32(a);
    printf("\n");

    // 相让a的第二位置0
    a = a & (~0b100);
    printf("a = %d\n",a);
    print_bin32(a);
    printf("\n");

    return 0;
}
```

### 按位或特点

```
0 | 1 = 1
1 | 1 = 1
```

 - 任何数与$1$按位或都是$1$

```
0 | 0 = 0
1 | 0 = 1
```

 - 任何数与$0$按位或都是原来的数

利用这个特点对特定位置的数置$1$

```c
#include <cstdio>
#include <cstring>

/* num:数   len:长度*/
char s4_pbin[40];
char * p_bin(int n,int len){
    memset(s4_pbin,'0',sizeof(s4_pbin));
    s4_pbin[len+1] = '\0';

    while(n && len){
        s4_pbin[len--] = (n & 1)+'0';
        n >>=1;
    }
    return s4_pbin+1;
}
#define print_bin4(i)               printf("%s", p_bin(i,4))
#define print_bin8(i)               printf("%s", p_bin(i,8))
#define print_bin16(i)              printf("%s", p_bin(i,16))
#define print_bin32(i)              printf("%s", p_bin(i,32))


int main(){
    int a = 0b1000;
    printf("a = %d\n",a);
    print_bin32(a);
    printf("\n");

    // 相让a的第二位置1
    a |= 0b100;
    printf("a = %d\n",a);
    print_bin32(a);
    printf("\n");

    return 0;
}
```

### 按位异或特点

**异**或的口决:**异**时为真.

```
1 ^ 1 = 0
0 ^ 1 = 1
```

 - 任何数与$1$进行异或都是这个数取反

```
1 ^ 0 = 1
0 ^ 0 = 0
```
 - 任何数与$0$进行异或都是这个数

利用这个性质可以快速对特定位进行取反

```c
#include <cstdio>
#include <cstring>

/* num:数   len:长度*/
char s4_pbin[40];
char * p_bin(int n,int len){
    memset(s4_pbin,'0',sizeof(s4_pbin));
    s4_pbin[len+1] = '\0';

    while(n && len){
        s4_pbin[len--] = (n & 1)+'0';
        n >>=1;
    }
    return s4_pbin+1;
}
#define print_bin4(i)               printf("%s", p_bin(i,4))
#define print_bin8(i)               printf("%s", p_bin(i,8))
#define print_bin16(i)              printf("%s", p_bin(i,16))
#define print_bin32(i)              printf("%s", p_bin(i,32))


int main(){
    int a = 0b1000;
    printf("a = %d\n",a);
    print_bin32(a);
    printf("\n");

    // 相让a的第二位置取反
    a ^= 0b100;
    printf("a = %d\n",a);
    print_bin32(a);
    printf("\n");

    return 0;
}
```


连续的异或操作可以统计1的数量是偶数个还是奇数个.

### 按位取反特点

没有

### 如何得到连续的低位1

```
0b1111
```

你想得到连续$4$个1
```c
(1<<4)-1  == 0b1111
```

## 进阶

二进制数A第i位置1

$$
x  = x |  (1<<(i-1))
$$

二进制数A第i位置0

$$
x  = x &  ~(1<<(i-1))
$$

二进制数A前i位取反

```
x ^ ((1<<i)-1)
```

二进制数A

## 二进制数A的某一个部分

`0 ^ 1 = 1`,0变1
`1 ^ 1 = 0`,1变0
`1 ^ 0 = 1`,1不变
`0 ^ 0 = 0`,0不变


`01010101 ^ 000111 = 01011010`

二进制数A中只保留最低位1后的大小(lowbit)
`x & (-x)`

## lowbit:得到数字只保留二进制最低位1后形成大小

核心

```c
int lowbit(int a){
    return a&(-a);
}
```

**测试**
```c
#include <cstdio>
#include <cstring>

//输出二进制
void p_bin(int n){
    char a[20];
    char b[20] = {0};
    int idx= 0;
    while(n){
        int t = n & 1;
        a[idx++] = t +'0';
        n = n >>1;
    }

    int i;
    for(i=0;i<idx;i++)
        b[i] = a[idx-i-1];

    printf("%s\n",b);

}

int low_bit(int a){
    return a&(-a);
}

int main(){
    int i;
    for(i=1;i<=10;i++){
        printf("%d:  ",i);
        p_bin(i);
        printf("    low_bit: %d  ",low_bit(i));
        p_bin(low_bit(i));
    }

    return 0;
}
```
## 把最低位1置0

```
n = n &(n-1);
```
## 得到二进制中1的数量


```c
int numOf1(int n){
    int cnt = 0;
    while(n){
        cnt++;
        n = n &(n-1);
    }
    return cnt;
}
```

原理:把一个整数减1后再与原来的整数按位与,得到的结果相当于是把整数和的二进制表示中最右边的1变成0.

例如: n = 7

| n | 对应二进制 | 操作后      |
|---|------------|-------------|
| 7 | 111        | 7&(7-1) = 6 |
| 6 | 110        | 6&(6-1) = 4 |
| 4 | 100        | 4&(4-1) =0  |


更好的方法

```c++
_builtin_popcount()
```
- [_builtin_popcount()计算二进制中多少个1_gaochao1900的专栏-CSDN博客](https://blog.csdn.net/gaochao1900/article/details/5646211)

## 子集枚举

在做**集合类动态规划的时候有重要的作用**

二进制数$A$所有的子集$S$

```
1011
```

子集:

```
1011    # 自己本身
1010    
1001
1000
0011
0010
0001
```

**代码实现**

```c
int s;
for (s=A;s;s = (s-1)&A){
    //s
}
```

原理:一个数减1后,变得离它近的一个较小的数,然后`&A`,只会保留相应1位置的1,得到一个子集,然后这个子集最次缩小.


::: oneWordAlgo

`(s-1)&A`

:::
