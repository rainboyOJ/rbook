## 进制

二位的十进制数的变化如下

$$
\begin{array}{c}
00 \\
01 \\
02 \\
03 \\
04 \\
05 \\
06 \\
07 \\
08 \\
09 \\
10 \\
11 \\
12 \\
13 \\
\cdots
\end{array}
$$

十进制就是逢十进一,也就是单个字符不能表示十

三位的二进制数变化如下

$$
\begin{array}{c|c}
\text{binary} & \text{decimal} \\
\hline \\
000 & 0 \\
001 & 1 \\
010 & 2 \\
011 & 3 \\
100 & 4 \\
101 & 5 \\
110 & 6 \\
111 & 7 \\
\end{array}
$$

二进制就是逢二进一,也就是单个字符不能表示二

## 一个小故事

有一个神奇的星球$A$,这个星球上的每个人都有
两只手，所以最多只能拿两个苹果.

有一个很聪明的人$B$发现可以利用这个性质，进行计数

于是他找了有$3$个小朋友:$a_2,a_1,a_0$, $B$每次给$a_0$一个苹果🍎,每个小朋友$a_i$遵循一个很简单的规则如下

- 每一个小朋友$a_i$,只要两个手的都拿了苹果,为了避免以后拿不了苹果,他会立刻扔了一个苹果,并给$a_{i+1}$一个苹果

那么显然,随着,$B$给的苹果的数量的增多,那么这3个小朋友会形成如下的**状态**

$$
\begin{array}{cccc}
a_2 & a_1 & a_0 & \text{🍎数量}\\
\hline
0 & 0 & 0 & 0\\
0 & 0 & 1 & 1\\
0 & 1 & 0 & 2\\ 
0 & 1 & 1 & 3\\ 
1 & 0 & 0 & 4\\ 
1 & 0 & 1 & 5\\ 
1 & 1 & 0 & 6\\ 
1 & 1 & 1 & 7\\ 
\end{array}
$$

发现

- 每一个$01$序列都对应一个**数量**
- 可以认识到,只到找到足够的小朋友,就可以表示任意的自然数$\mathbb{N}$
- 这个$01$序列就是二进制,因为每一位都不会有表示数量$2$的符号

问:如何得知每个状态($01$串,也就是二进制)代表了$B$给出了多少数量的苹果?例如,$001$代表$B$给出了一个苹果


$$
\begin{array}{cccl}
a_2 & a_1 & a_0 & \text{数量} \\
\hline
0 & 0 & 0 & 0\\
0 & 0 & 1 & 1\\
0 & 1 & 0 & 1 \times 2 + 0  = 2\\ 
0 & 1 & 1 & 1 \times 2 + 1  = 3\\ 
1 & 0 & 0 & 1 \times 4 + 0+0  = 4\\ 
1 & 0 & 1 & 1 \times 4 + 0+1  = 5\\  
1 & 1 & 0 & 1 \times 4 + 1\times2+0  = 6\\  
1 & 1 & 1 & 1 \times 4 + 1\times2+1  = 7\\  
\end{array}
$$

最后得到公式:二进制数$a_ia_{i-1}\cdots a_0$表示数量

$$
a_ia_{i-1}\cdots a_0 = a_i \times 2^i + a_{i-1} \times 2^{i-1} + \cdots + a_0 \times 2^0, a_i \in \{0,1\}
$$

验证一下我们的想法是否正确,由四个小朋友形成的状态为$1101$,那对应的苹果的数量是多少?

公式计算为:
$$
2^3 + 2^2 + 2^0 = 8 + 4 + 1 = 13
$$

使用`python`代码验证一下

```python
# 使用int把字符串转成对应的数字
a=int("1101",2)  # 2 表示字符串是2进制的
print(a)
```

输出结果为$13$,证明我们上面的想法是正确的



## 二进制字符串转成十进制数

二进制转十进制的公式很简单,写一个二进制字符串转十进制数的代码也不难.

```cpp
#include <bits/stdc++.h>
using namespace std;

char num[] = "10101001";
  
//将二进制转换为十进制的功能
int binaryToDecimal(string n)
{
    string num = n;
    int dec_value = 0;
  
    // 将基础值初始化为1，即2^0
    int base = 1;
  
    int len = num.length();
    for (int i = len - 1; i >= 0; i--) 
    {
        if (num[i] == '1')
            dec_value += base;
        base = base * 2;
    }
  
    return dec_value;
}
int main()
{
    cout << binaryToDecimal(num) << endl;
    reutrn 0;
}  
```


## 十进制转二进制

我们都会一个算法,拆数

```cpp
int a = 123;
while( a ) {
    int t = a % 10 ; //得到个位上的数
    a /= 10; //删除个位上的数
    cout << t <<" ";
}
```

与上面的方法一样,我们

1. 先得到二进制的个位上的数
2. 再删除二进制个位数

如何删除二进制个位上的数

一个二进制数$1101$去除个位上的为后变为$101$,那两都有什么数学上的关系呢?例如进制$123$去除个位上的数只需要使用整除 $123 \div 10 = 12$,现在我们要找到一个类似的公式,直接代入公式,可以去除二进制的个位

若一个数为$A = a_i \times 2^i + a_{i-1} \times 2^{i-1} + \cdots + a_0 \times 2^0$
,去除二进制

则它除二进制的个位后变成$B = a_i \times 2^{i-1} + a_{i-1} \times 2^{i-2} + \cdots + a_1 \times 2^0$

那么$B$与有$A$之间有什么关系呢?,

1. 若$a_0=1$,则$A$是奇数,$A = 2 \cdot B + 1$
1. 若$a_0=0$,则$A$是偶数,$A = 2 \cdot B$

所以对对应的关系如下所示:

$$
\begin{array}{c}
A \\
\uparrow \\
B \times 2,a_0=0\\
\uparrow \\
B \\
\downarrow \\
B \times 2 + 1, a_0 = 1\\
\downarrow \\
A 
\end{array}
$$

我们又知道,若$x= 2k,y=2k+1$,则$x/2 = \lfloor y/2\rfloor = k$

所有得到结论:

1. 十进制$A$整除$2$得到的结果相当于对应二进制数删除个位(末尾)的数得到的十进制的数$B$
2. 十进制数$B$乘以$2$相当对应的二进制数全体左移一位,末尾添加一个$0$得到的新的二进制数对应的十进制数

于是得到下面的手动计算十进制转二进制方法:**短除法**

![short_div](./short_div.svg)

得到的序列为$1,0,1,1$,把序列反过来就是十进制数$13$对应的二进制表示$1101$,因为是先得到二进制的个位.


于是可以写出如下的二进制转二进制代码如下

`python`

```python
```

## c++ 10进制数转成二进制字符串

方法二: 使用 `bitset`

```
#include <iostream>
#include <bitset>

int main()
{
    int decimal = 242;
    std::bitset<8> binary(decimal);
    std::cout << binary << std::endl;
    return 0;
}
```

使用自己写的函数,实现短除法

```cpp
#include <iostream>

int decimalToBinary(int decimal)
{
    int binary = 0, base = 1;
    while (decimal != 0)
    {
        int remainder = decimal % 2;
        decimal /= 2;
        binary += remainder * base;
        base *= 10;
    }
    return binary;
}

int main()
{
    int decimal = 242;
    int binary = decimalToBinary(decimal);
    std::cout << binary << std::endl;
    return 0;
}
```