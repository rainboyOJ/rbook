#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;

//输出一个数的二进制
void print_bin(int t) {
    std::bitset<4> bs(t);
    cout << bs << endl;
}

int main (int argc, char *argv[]) {
    int a = 0b1111; //这个数就是十进制的15
    for(int i =0 ;i<= a;i++) {
        print_bin(i);
    }

    return 0;
}
