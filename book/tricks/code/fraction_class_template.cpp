struct Fraction {
    int a,b; // 分子分母

    //得到a,b的乘/除 后的公共符号
    //-1 表示负, 1 表示正
    static
    constexpr
    int sgn(int a,int b) {
        return (a^b) < 0  ? -1 : 1;
    }

    static
        constexpr
        int _abs(int a) { return a < 0 ? -a : a;}

    //构造函数
    constexpr
    Fraction(int a,int b)
        : a(sgn(a,b)*_abs(a)), //a来存公共符号
        b(_abs(b))
    {}


    bool operator==(const Fraction & oth)
    {
        return a == oth.a && b == oth.b;
    }

    bool operator<(const Fraction & oth)
    {
        return a * oth.b < oth.a * b;
    }

    //TODO
    Fraction operator*(const Fraction oth) const;
    Fraction operator-(const Fraction oth) const;
    Fraction operator+(const Fraction oth) const;
};

//无穷大的分数
const auto Fraction_inf = Fraction(1,0);
//无穷小的分数
const auto Fraction_neg_inf = Fraction(-1,0);

