/**
 * 离散化 discretization 
 * 使用方式
 * 创建变量: discrete disc
 *  - disc.push(v) 添加元素
 *  - disc.clear() 清空
 *  - disc.init() 存完数据,进行离散
 *  - disc.query(int x) 得到原数字x 对应的离散化后的值
 *
 * TODO 是否不使用stl的函数
 *  - unique
 *  - lower_bound
 *
 */
#include <bits/stdc++.h>
const int maxn = 1e5+5;

template<std::size_t N = maxn>
struct discrete {
    int a[maxn];
    int idx{0};
    int * last_unique_ptr = nullptr; //最后一个位置

    void clear() {
        idx = 0;
        last_unique_ptr = nullptr;
    }

    void push(int v) { //增加元素
        a[++idx] = v;
    }

    template<typename ...U>
    void push(U... v) { //增加元素
        (push(v),...);
    }

    int unique_size () const {
#ifdef DEBUG
        if(last_unique_ptr == nullptr)
            throw std::runtime_error("must call discrete(),before use unique_size()");
#endif
        return last_unique_ptr - (a+1);
    }

    //对存入的值进行离散化
    void init() {
        std::sort(a+1,a+1+idx);
        last_unique_ptr= std::unique(a+1,a+1+idx);
    }


#if 0
    //对数据arr,从1到n进行离散化
    template<std::size_t size>
    void pre_work(int arr[size],int n) {
        pre_work(a+1, a+1+n);
    }

    template<typename Iter>
        requires std::is_same_v<typename std::iterator_traits<Iter>::value_type, int>
    void pre_work(Iter begin ,Iter end) {
        std::sort(begin,end); //从小到大排序
        for( ; begin != end; ++begin)
            a[++idx] = *begin;
    }
#endif
    //查询x对应的值是
    int query(int x) {
#ifdef DEBUG
        if(last_unique_ptr == nullptr)
            throw std::runtime_error("must call discrete(),before use query(x)");
#endif
        
        //找到第一个>=x的位置
        auto pos = std::lower_bound(a+1, last_unique_ptr,x) - a;
        if( a[pos] == x)
            return pos;
        else 
            return 0; //返回0 表示没有找到
    }

    int operator[](int x) {
        return query(x);
    }

    int * begin() {
        return a+1;
    }

    int * end() {
#ifdef DEBUG
        if(last_unique_ptr == nullptr)
            throw std::runtime_error("must call discrete(),before use end()");
#endif
        return last_unique_ptr;
    }
};

