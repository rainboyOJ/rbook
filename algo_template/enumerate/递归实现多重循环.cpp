/*
模型: 有n个位置,每个位置有[0,m)种可能性,想互独立

样例:
3个位置,2种可能性,0,1
3 2
*/

#include <iostream>
using namespace std;
const int maxn = 10+5;
int n,m;
int rcd[maxn];

void loop_permutation(int dep){
    if( dep > n) {
        for(int i = 1;i <= n ;++i ) // i: 1->n
        {
            cout << rcd[i] << " ";
        }
        std::cout << "\n";
        return;
    }
    for(int i = 0;i < m ;++i ) // i: 0->m-1
    {
        rcd[dep] = i;
        loop_permutation(dep+1);
    }

}

int main () {
    std::cin >> n >> m;
    loop_permutation(1);
    return 0;
}
