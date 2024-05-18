#include <bits/stdc++.h>
using namespace std;
const int maxn = 1e6+5;

//输出一个数的二进制
void print_bin(int t) {
    std::bitset<4> bs(t);
    cout << bs << endl;
}

int main (int argc, char *argv[]) {
    int a = 0b1011;
    int s = a;
    for( ;s != 0;s = (s-1)&a) {
        print_bin(s);
    }

    return 0;
}
