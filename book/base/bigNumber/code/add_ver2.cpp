#include <iostream>
#include <string>
#include <cstring>
using namespace std;

struct BigInt {
    std::string num;
    BigInt() = default;

    BigInt(const char *s)  {
        num.clear();
        for (int i = strlen(s) - 1; i >= 0;i--){
            num.push_back(s[i] - '0');
        }
    }
    BigInt(std::string & s) : BigInt(s.c_str())  {}

    BigInt(const BigInt & b) : num(b.num) {}
    BigInt(BigInt && b) : num(std::move(b.num)) {}

    int size () const { return num.size(); }

    BigInt& operator=(const BigInt & a){
        num = a.num;
        return *this;
    }

    friend BigInt& operator+=(BigInt &a ,const BigInt & b) {
        int n = a.size();
        int m = b.size();
        if( m > n)
            a.num.append(m - n, 0);
        int carry = 0,s = 0; //进位
        for (int i = 0; i < n; i++)
        {
            if( i < m)
                s = a.num[i] + b.num[i] + carry;
            else
                s = a.num[i] + carry;
            carry = s / 10;
            a.num[i] = s % 10;
        }
        if( carry)
            a.num.push_back(carry);
        return a;
    }

    friend BigInt operator+(const BigInt & a , const BigInt & b ) {
        BigInt t;
        t = a;
        t += b;
        return t;
    }

    friend std::ostream & operator<<(std::ostream & out,const BigInt & a) {
        //倒过来输出
        int size = a.num.length();
        for (int i = size-1; i >=0;i--)
            out << int(a.num[i]);
        return out;
    }
};

char a[10000];
int main()
{
    cin >> a;
    BigInt b1(a);
    cin >> a;
    BigInt b2(a);

    BigInt b3 = b1 + b2;
    cout << b3 << endl;

    return 0;
}