## 定义

只允许在一端进行插入和删除操作的线性结构，称为栈。

- 栈顶
- 栈底

## 性质

先进后出,First In Last Out,FILO

## 基本操作

- `head`:表示栈上最上面一个有元素的位置的上一个位置


```cpp
const int maxn = 1e5+5;//栈的最大容量
int sta[maxn]; //栈的存储空间
int head = 0;  //栈顶
```   

1. 添加元素

```cpp
void push(int n){ 
    sta[head++] = n; //插入,为什么是top++,不是++top?
}
```

2. 删除元素

```cpp
void pop(){
    return top--; 
}
```

3. 得到最上面的元素的值

```cpp
int top() {
    return sta[top-1];
}
```

4. 栈是否空
```cpp
bool empty() {
    return top == 0;
}
```


## 模板

```cpp
<%- include("/algo_template/data_structure/stack.cpp") _%>
```


## 练习题目

- luogu P1241
- luogu P1739 表达式括号匹配
- luogu P1449 后缀表达式
- luogu P4387
- openjudge 3.4 2406
- openjudge 3.3 6263
