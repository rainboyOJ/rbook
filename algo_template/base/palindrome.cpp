// 双指针判断回文:两根指针从两端向中间夹,一步比一对
bool is_palindrome(const string &s) {
    int i = 0, j = (int)s.size() - 1;
    while (i < j) {
        if (s[i] != s[j]) return false; // 第一个不等就是答案
        i++;
        j--;
    }
    return true;
}

// 数组版:长度放在参数里,判 a[1..n]
bool is_palindrome(int a[], int n) {
    int i = 1, j = n;
    while (i < j) {
        if (a[i] != a[j]) return false;
        i++;
        j--;
    }
    return true;
}
