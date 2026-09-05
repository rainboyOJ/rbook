#include <iostream>
using namespace std;

int n;

// dep = depth 表示递归的深度
void print_num(int dep) {
    if( dep > n) {
        cout << endl;
        return;
    }
    cout << dep << " "; //这里是前进阶段
    print_num(dep + 1);
    cout << dep << " "; //这里是回溯阶段
}

int main(){
    cin >> n;
    print_num(1);
    return 0;
}