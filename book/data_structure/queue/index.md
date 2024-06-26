## 定义

队列是一种特殊的线性表，具有先进先出和后进先出的性质。只允许一端进行插入操作，另一端进行删除操作的线性数据结构

- 队头
- 队尾

## 性质

先进先出,First In First Out, FIFO

## 操作

- $head$,永远指向队列的开头的第一个元素的位置
- $tail$,永远指向队列的结尾的最后一个元素的后面一个位置

也就是$[head,tail)$表示元素的范围

### 创建队列

```cpp
const int maxn = 1e5+5; //队列的最大容量
int que[maxn]; //队列的存储空间
int head= 0, tail = 0;  //队头和队尾
```

### 基本操作

1. 插入元素
```cpp
void push (int n){
    que[tail++] = n; //为什么是tail++,不是++tail?
}
```

2. 删除元素
```cpp
void pop() {
    head++;
}
```

3. 获得队列中第一个元素

```cpp
int front() {
    return que[head];
}
```

4. 获得队列中最后一个元素
```cpp
int back() {
    return que[tail-1];
}
```

5. 判断队列是否为空
```cpp
bool empty() {
    return head == tail;
}
```


6. 获得队列中元素的个数
```cpp
int size() {
    return tail-head;
}
```

## 模板

```cpp
<%- include("./queue.cpp")%>
```

## 练习

- <%- pid_to_url('luogu', '1540','机器翻译') %>
- <%- pid_to_url('luogu', '1090','合并果子') %> 数学归纳法,数学直觉
- <%- pid_to_url('noiopenjudge', 'ch0304/2406','Card Stacking') %> 环形队列,模拟,USACO December 2007 Bronze
- <%- pid_to_url('noiopenjudge', 'ch0304/2729','Blah数集') %>  神奇证明,数学直觉,暴力验证
- <%- pid_to_url('leetcodecn', '225','用队列实现栈') %>
- 150. 逆波兰表达式求值 (https://leetcode-cn.com/problems/evaluate-reverse-polish-notation/)
- 402. 移掉 K 位数字(https://leetcode.cn/problems/remove-k-digits/description/) TODO 单调栈
