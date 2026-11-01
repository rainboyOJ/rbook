// P17828 [CSP-J 2026] 回文串 / string
// 串用游程压缩给出,不能展开;左右指针在"段"上相向走
#include <bits/stdc++.h>
using namespace std;

int n;
long long a[200005];  // a[i]: 第 i 段有多少个字符
char c[200005];       // c[i]: 第 i 段的字符

int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);

    cin >> n;
    for (int i = 1; i <= n; i++) cin >> a[i] >> c[i];

    long long ans = 0;
    int li = 1, ri = n;              // 还没配完的最外层两段
    long long remL = a[li];          // 左段还剩几个字符没配
    long long remR = a[ri];          // 右段还剩几个字符没配

    while (li < ri) {
        long long k = min(remL, remR);   // 这次能配 k 对
        if (c[li] != c[ri]) ans += k;    // 每对不等都要改一个位置
        remL -= k;
        remR -= k;
        if (remL == 0) {
            li++;
            remL = a[li];            // li 不会超过 ri,读完正好退出循环
        }
        if (remR == 0) {
            ri--;
            remR = a[ri];
        }
    }
    // li == ri 时,中间剩的那段是自己和自己配,字符必然相同,贡献 0

    cout << ans << "\n";
    return 0;
}
