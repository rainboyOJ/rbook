//Author by [Rainboy](https://github.com/rainboylvx) 
//date: 2025-05-04 09:05:05
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
const int maxn = 1e7+5;
int n,m;
int a[maxn];
int ver_cnt = 0; // 当前有多少个版本

//静态内存
template<typename T,int size>
struct static_mem {
    int idx = 0;
    T mem[size+5];

    int get(){ return idx++;}
    
    int copyFrom(int rt) {
        int nidx = get();
        memcpy(&mem[nidx],&mem[rt],sizeof(mem[0]));
        return nidx;
    }

    bool empty() const { return idx == size;}
    int memed_size() const { return idx;}

    //下标操作
    T & operator[](const int idx){ return mem[idx]; }

};

struct treeNode {
    int lson,rson; // 左右孩子的编号
    int val; // 节点的值
    // int flag; 
};

static_mem<treeNode,8*maxn> mem;
int root[maxn]; //记录每个树的根编号


//持久化线段树, 数组
struct sgt_persistent_array {
    int mid(int l,int r){ return (l+r) >> 1;}
    
    void push_up(int rt,int lson,int rson){
        //根据p3919的题目的意思,不需要push_up
        //因为 不需要维护区间信息

    }

    int build(int l,int r){
        int nowTree = mem.get();
        if( l == r){
            cin >> mem[nowTree].val;
            return nowTree;
        }
        int m = mid(l,r);
        mem[nowTree].lson = build(l,m);
        mem[nowTree].rson = build(m+1,r);
        return nowTree;
    }

    // 更新一个节点,并返回创建的新的链的顶点编号
    int update_one_with_history(int pos,int val,int rt,int l,int r)
    {
        //进入一个节点后,立即创建一个新的节点
        int nowRt = mem.copyFrom(rt);
        if( l == r){
            mem[nowRt].val = val;
            return nowRt;
        }
        int m = mid(l,r);
        if( pos <=m ) mem[nowRt].lson = update_one_with_history(pos,val,mem[rt].lson,l,m);
        else mem[nowRt].rson = update_one_with_history(pos,val,mem[rt].rson,m+1,r);

        return nowRt;
    }

    int query(int p,int rt,int l,int r){
        if( l == r ){
            return mem[rt].val;
        }
        int m = mid(l,r);
        if( p <= m) return query(p,mem[rt].lson,l,m);
        return query(p,mem[rt].rson,m+1,r);
    }


} sgt;

void init(){
    std::cin >> n >> m;
    root[ver_cnt++] = sgt.build(1,n);
}

int main () {
    std::ios::sync_with_stdio(false); cin.tie(0); cout.tie(0); // 关闭io同步
    init();
    for(int i = 1;i <= m ;++i ) // i: 1->m
    {
        int v,idx,pos,chg;
        cin >> v >> idx >> pos;
        if( idx == 1 ){
            cin >>  chg;
            root[ver_cnt++] = sgt.update_one_with_history(pos,chg,root[v],1,n);
        }
        else {
            root[ver_cnt++] = root[v];
            cout << sgt.query(pos,root[v],1,n) <<"\n";
        }
    }


    return 0;
}

