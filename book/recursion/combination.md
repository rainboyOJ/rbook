## Gosper's Hack

**Gosper's Hack**是一种生成 $n$$n$n 元集合所有 $k$$k$k 元子集的算法，它巧妙地利用了位运算

例如从5个数中选3个数的所有可能性,所以它是一个组合算法

算法的过程

通过``A_i``算出``A_{i+1}``,

假如``A_i = 101100``

1. 算出``lb = A_i & - A_i``,``lb = 000100``
2. 计算``r = lb+A_i``,也就是两者的和,``r = 110000``,后使``A_i``最后连续的1进位
3. 计算``xor = r ^ A_i``,作用是保留``A_i``最后的连续的1和前面的1,也就进位的1和最后连续的1,
4. 对``xor``来说,它应该作为靠右的1,它的1的数量,加上我们本身要已经进位的1,那应该去除两个1
5. 所以``xor >> 2``,然后,再右移原来的末尾的0的数量,得到一个数字``y``
6. 最后`y | r`,``r``末尾连续1进位后的数字,``y``末尾的1向右移动的数字


```cpp
#include <iostream>
#include <bitset>
#include <string>
#include <iomanip>
using namespace std;

void print(string name ,int a) {
    std::cout << setw(5) << name << ": ";
    cout <<bitset<10>(a) << '\n';
}

#define  log(one) print(#one,one)

int main(){
    int cur = 0b1001100;
    log(cur);

    int lb = cur & -cur;
    log(lb);

    int r = cur +lb;
    log(r);

    int x = r^cur;
    log(x);

    int y = x >> (__builtin_ctz(lb) + 2);
    log(y);
    log(y|r);

    return 0;
}
```
输出

```
  cur: 0001001100
   lb: 0000000100
    r: 0001010000
    x: 0000011100
    y: 0000000001
  y|r: 0001010001
```


最终代码


```
void GospersHack(int k, int n)
{
    int cur = (1 << k) - 1;
    int limit = (1 << n);
    while (cur < limit)
    {
        // do something
        int lb = cur & -cur;
        int r = cur + lb;
        cur = ((r ^ cur) >> __builtin_ctz(lb) + 2) | r;
        // 或：cur = (((r ^ cur) >> 2) / lb) | r;
    }
}
```

## 其它方法

向vector是加入1,然后使用`std::next_permutation`来求

```

实现5,选3
std::vector v {0,0,1,1,1};
```

## 参考




- [算法学习笔记(75): Gosper's Hack - 知乎](https://zhuanlan.zhihu.com/p/360512296)
