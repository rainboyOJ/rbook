#include <iostream>
#include <cstring>
using namespace std;
const int maxn = 1e5+5;

//bn = big_number
struct bn { 
    int len;
    int a[maxn];

    //索引
    int & operator[](int id) { return a[id]; }

    //赋值
    bn & operator=(int b) {
        len = 0;
        while( b) {
            a[len++] = b % 10;
            b /= 10;
        }
    }

    //赋值
    bn & operator=(const bn & b) {
        len = b.len;
        for (int i = 0; i < len; ++i) a[i] = b.a[i];
    }
};

// a = b+c
void bn_add( bn & a,bn &b ,bn & c) {
    //清空a的值
    memset(&a,0,sizeof(a));
    a.len = max(b.len,c.len);
    for(int i =0 ;i<a.len;i++) {
        a[i] += b[i] + c[i];
        a[i+1] = a[i] /10;
        a[i] %= 10;
    }
    if(a[a.len]) a.len++;
}

void bn_print(bn & a) {
    for(int i = a.len-1 ;i>=0;i--) cout << a[i];
}

void str2bn(char * a,bn &b) {
    b.len = strlen(a);
    int cnt = 0;
    for(int i=b.len-1;i>=0;i--) b[cnt++] = a[i] - '0';
}

// a = b
void copy( bn & a,bn &b) {
    a.len = b.len;
    for(int i = 0;i < a.len ;++i ) a[i] = b[i];
}
