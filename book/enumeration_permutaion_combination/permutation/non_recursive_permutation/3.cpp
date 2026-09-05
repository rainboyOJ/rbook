//实现部分排列
//核心思想： 

/*
建立一个集合S： 存未使用的元素

1. 从右向左找到 第一个可以增加的元素，
2. 如果当前元素不可以增加,就放入到S里
3. 找到第一个可增加元素后进行增加,并把原来的元素放入到S里
4. 再从当前位置回到结尾(从左向右边)
*/

//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2024-06-28 20:17:53
#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;
int n,m;
int a[maxn];

int s[maxn];

void set_use(int i) { s[i] = 1;}
void set_no_use(int i) { s[i] = 0;}

int get_first_no_choose() {
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        if( !s[i]) {
            return i;
        }
    }
    return 0;
}

int get_last_no_choose() {
    for(int i = n;i >=1 ;--i ) // i: 1->n
    {
        if( !s[i]) {
            return i;
        }
    }
    return 0;
}

//从右向左找,一个可以变的更大的位置
int get_upable_pos() {
    int last_v = a[get_last_no_choose()];
    for(int  i = n;i>=1;--i) {
        if( a[i] < last_v)
            return i;
    }
    return 0; //没有找到,表明已经达到了最大的值
}

int main (int argc, char *argv[]) {
    

    return 0;
}
