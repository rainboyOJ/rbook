
## 教学过程


1. TODO: 带学生使用小学生法解一遍题目

数据 生成程序

```
int a[100];
int n = rnd(1,5);
int m = 1;
cout << n << " " << 1 << endl;
for(int i=1;i<=n;i++) {
    a[i] = rnd(1,10);
}
sort(a+1,a+1+n);
for(int i=1;i<=n;i++) {
    cout << a[i] << " ";
}
cout << "\n";
cout << rnd(1,13);
```


找到第一个大于等于x的数

- 怎么找最快
- 如果序列上不存在第一个大于等于x的数，怎么办

2. 给出我的代码`bs_find`


3. 证明`bs_find`的正确性,

数学归纳法

4. 证明`bs_find`的时间复杂度$nlogn$

本质一个长度为n的木棍,最多经过最少次折半能到达1

$\lceil log_2^n \rceil$

5. 做题目

noiopenjduge
luogu

6. 总结常见的问题模型
