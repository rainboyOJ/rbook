// 在1.cpp的基础上加上 离散化
//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2025-04-05 20:27:03
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
#ifndef DEBUG
#define log(...)
#else
#define log(args...) { cout << "LINE:" << __LINE__ << " : ";string _s = #args; replace(_s.begin(), _s.end(), ',', ' '); stringstream _ss(_s); istream_iterator<string> _it(_ss); err(_it, args); }
void err(istream_iterator<string> it) {}

template<typename T>
void err(istream_iterator<string> it, T a) {
cerr << *it << " = " << a << "\n";
}

template<typename T, typename... Args>
void err(istream_iterator<string> it, T a, Args... args) {
cerr << *it << " = " << a << ", ";
err(++it, args...);
}
#endif
const int maxn = 1e6+5;
// const int range = 1e5+5;
int range =7;
int n,m;
int a[maxn];

//所有的x的元素
std::vector<int> vecx;
int diff_cnt_x; //不同的x元素的数量

//边的结构休
struct _edge {
    int s,t; //开始，结束
    int y; // 高度
    bool down; //是不是下底

    _edge() {}
    _edge(int s,int t,int y,bool down = 1): s(s),t(t),y(y),down(down) {}

    //比较大小
    bool operator<(const  _edge &b) { return y < b.y; }

};

int e_cnt;
_edge e[maxn];


//这个sgt用来求 区间内不为0的元素的个数
// 也就是区间的长度
template<typename T=int,int N=maxn>
struct sgt_range {
    T tr[N*4+5]; // 表示这段区间不为0的数量
    T flag[N*4+5]; //flag 里的内容与题目有关，灵活设定

    T left[N*4+5]; //每个节点代表的区间
    T right[N*4+5];

    // flag = x 表示这段区间全部加上x
    inline int lp(int p){return p<<1;}
    inline int rp(int p){return (p<<1)|1;}
    inline int mid(int l,int r){return (l+r)>>1;}

    inline void pushup(int l,int r,int p){  //向上合并
        if( flag[p] ) {
            // tr[p] = vecx[r-1]-vecx[l-1]+1;
            tr[p] = right[p] - left[p];
        }
        else if( l == r) { // is leaf 且为0
            tr[p] = 0;
        }
        else { // 不是leaf，也没有标记
            tr[p] = tr[lp(p)] + tr[rp(p)];
        }
    }

    void build(int l,int r,int p){ //建立
        if( l == r ) {
            //到了叶子结点
            // 更新叶子结点的代表的区间
            left[p] = vecx[l-1];
            right[p] = vecx[l];
            return;
        }
        int m = mid(l,r);
        build(l,m,lp(p));
        build(m+1,r,rp(p));
        left[p] = left[lp(p)];
        right[p] = right[rp(p)];
    }

    void debug(int l=1,int r=range,int p=1){ //建立
        cout << l <<" ";
        cout << r <<" ";
        cout << p << " ";
        cout << flag[p] << " ";
        cout << tr[p] << " ";
        cout << endl;
        if( l == r ) {
            return;
        }
        int m = mid(l,r);
        debug(l,m,lp(p));
        debug(m+1,r,rp(p));
    }

    // 区间更新
    void update(int L,int R,T v,int l,int r,int p){ 
        if(L <= l && r <= R) {
            flag[p] += v;
            pushup(l,r,p);
            return;
        }
        int m = mid(l,r);
        if( L<=m) 
            update(L,R,v,l,m,lp(p));
        if( R>=m+1)
            update(L,R,v,m+1,r,rp(p));
        pushup(l,r,p);
    }

    //区间查询
    T query(int L,int R,int l,int r,int p){
        if( L <=l && r<=R ) {
            return tr[p];
        }
        int m = mid(l,r);
        T ret = 0;
        if( L <= m ) ret+=query(L,R,l,m,lp(p));
        if( R >=m+1) ret+=query(L,R,m+1,r,rp(p));
        pushup(l,r,p);
        return ret;
    }
};
sgt_range<> sgt;


void init() {
    std::cin >> n;
    for(int i = 1;i <= n ;++i ) // i: 1->n
    {
        int x1 ,y1 ,x2,y2;
        std::cin >> x1 >> y1;
        std::cin >> x2 >> y2;
        e[++e_cnt] = {x1,x2,y1,1};
        e[++e_cnt] = {x1,x2,y2,0};
        vecx.push_back(x1);
        vecx.push_back(x2); // ? 为什么要-1 ？
    }

    // 按矩形的边高度 从小到达排序
    sort(e+1,e+1+e_cnt);
}

void discrete() {
    std::sort(vecx.begin(),vecx.end());
    diff_cnt_x = std::unique(vecx.begin(),vecx.end()) - vecx.begin();
}

int _find_val_id(int val) {
    return lower_bound(vecx.begin(),vecx.begin()+diff_cnt_x,val) - vecx.begin()+1;
}


int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    init();
    discrete();
    range = diff_cnt_x-1;
    sgt.build(1,range,1);
    //没有离散化,可以解20%
    int pre_h = e[1].y;
    ll pre_w = 0;
    ll sum = 0;
    for(int i =1;i<=e_cnt;i++)
    {
        const _edge &te = e[i];
        //转化区间为连续的leaf
        int L = _find_val_id(te.s);
        int R = _find_val_id(te.t)-1;
#ifdef DEBUG
        cout << te.s << " ";
        cout << te.t << " ";
        cout << te.y << " ";
        cout << te.down << " ";
        cout << endl;
        cout << "L : " << L << " ";
        cout << "R : " << R << "\n";
#endif
        if(te.down){
            // 为什么te.t-1 ?
            sgt.update(L,R,1,1,range,1);
        }
        else {
            sgt.update(L,R,-1,1,range,1);
        }

        //永远查询根节点
        ll len = sgt.query(1,range,1,range,1);
        // sum += (len * (te.y - pre_h));
        sum += pre_w * (te.y - pre_h);
#ifdef DEBUG
        cout << "len " << len ;
        cout << " add sum = " << pre_w * (te.y - pre_h);
        cout <<endl;
        sgt.debug();
        cout <<endl;
        cout <<endl;
        cout <<endl;
#endif
        pre_w = len;
        pre_h = te.y;
    }
    cout << sum << endl;
    return 0;
    
}

