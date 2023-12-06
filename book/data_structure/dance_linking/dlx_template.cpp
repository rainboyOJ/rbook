// dlx 矩阵的十字交叉双向循环链表的数据结构
// dancing link x


#include <iostream>
#include <cstring>
int n,m;

enum Dir {
    u,d,l,r
};

struct dlx_node {
    int u,d,l,r; // 上下左右的连接的点的下标
    int col,row; // 这个点所在的行与列
    // int idx;
    // int ele; //元素值

    dlx_node & L() {
        return *this;
    }
};



template<std::size_t N>
struct dlx {
    int cnt[505];  // 每一列的1的数量
    int idx{0};  // 使用的点的数量计数
    dlx_node mem[N]; //内存池

    //第i行的开头与结尾的标记
    //若这一行还有点,没有为-1
    int row_h[505],row_t[505];

    dlx() {
        memset(row_h,-1,sizeof(row_h));
        memset(row_t,-1,sizeof(row_t));
    }


    inline int get() {return idx++;}
    inline dlx_node& get_node() { return mem[get()];}
    inline dlx_node& get_node(int i) { return mem[i];}

    //
    void append(int a_idx,int b_idx) {
        auto & a = get_node(a_idx);
        auto & b = get_node(b_idx);

        b.u = a_idx , b.d = a.d; // step 1
        get_node(a.d).u = b_idx; // step 2
        a.d = b_idx; // step3
    }

    //最新的没有使用的编号
    int last_idx() const {
        return idx;
    }

    //初始化, 建立第一行的表头
    // m 表示列数
    //
    //+->[|]<->[]<->[]<->[]<->[]<-+
    //|                           |
    //+---------------------------+
    //
    void init(int cols) {
        for(int i=0;i<=cols;++i){
            auto & node = get_node();
            node.l = i-1,node.r = i+1;
            node.u = node.d = i;
        }
        get_node(0).l = cols;
        get_node(m).r = 0;
    }
    int row_head,row_tail; //当前行的开始与结尾的点

    void update_row_ht() {
        row_head = row_tail= last_idx(); //使当前的
    }


    //添加一个新的点
    void add(int x,int y)
    {
        int i = get(); //一个新点的计数 下标
        ++cnt[y]; //i列 计数+1

        auto & n = get_node(i);
        n.row = x;
        n.col = y;
        append(y, i); //在y点的后面添加一个i

        // 添加这一行
        // 需要这一行的开头与结尾的编号
        if(row_h[x] == -1) {
            //若当前行没有点,就把开头结尾设为这个点
            row_h[x] = row_t[x] = i;
        }

        auto & head = get_node(row_h[x]);
        auto & tail = get_node(row_t[x]);

        head.l = i;
        tail.r = i;
        n.r = row_h[x]; //加到末尾
        n.l = row_t[x];
        row_t[x] = i;

    }

    //从col列删除
    void del(int col) {
        //把第p列从 第一行表头中删除
        auto & c = get_node(col);
        auto & cl = get_node(c.l);
        auto & cr = get_node(c.r);
        cl.r = c.r;
        cr.l = c.l;

        //这列中所的行删除
        for( int i = c.d ; i != col ; i = get_node(i).d)
        {
            auto &n = get_node(i);
            for(int j = n.r ;j != i;j = get_node(j).r )
            {
                auto & jn = get_node(j);
                cnt[jn.col]--; // 计数-1

                auto & jn_u = get_node(jn.u);
                auto & jn_d = get_node(jn.d);
                jn_u.d = jn.d;
                jn_d.u = jn.u;
            }
        }

    }
    //从col 列恢复,到过来恢复
    void resume(int col) {
        auto & c = get_node(col);
        for(int i = c.u; i != col ; i = get_node(i).u )
        {
            auto & in = get_node(i);
            for(int j = in.l ; j != i ;j = get_node(j).l)
            {
                auto & jn = get_node(j);
                auto & jn_u = get_node(jn.u);
                auto & jn_d = get_node(jn.d);
                jn_d.u = j;
                jn_u.d = j;
                cnt[jn.col]++;
            }
        }
        auto & cl = get_node(c.l);
        auto & cr = get_node(c.r);
        cr.l = col;
        cl.r = col;
    }

    // debug
    void print_row(int row_number) {
        std::cout << "row_head : " << row_h[row_number] << "\n" ;
        std::cout << "row_tail: " << row_t[row_number] << "\n" ;

    }

    // 输出整个dlx
    void print() {

    }

    dlx_node & head() {
        return  get_node(0);
    }

};

dlx<900> mydlx;



template<std::size_t N>
struct _stack{
    int a[N];
    int top = 0;
    void push(int i) {
        a[top++] = i;
    }

    void pop() {
        top--;
    }
    bool empty()
    {
        return top == 0;
    }
};
_stack<505> sta;

bool dfs() {

    auto & head = mydlx.head();
    if( head.r == 0)
        return true;
    int col = head.r;
    for( int i = col ;  i ; i = mydlx.get_node(i).r)
        if( mydlx.cnt[i] < mydlx.cnt[col])
            col = i;

    mydlx.del(col);
    for(int i = mydlx.get_node(col).d ;  i != col;  i = mydlx.get_node(i).d)
    {
        auto & n = mydlx.get_node(i);
        sta.push(n.row);
        for(int j = mydlx.get_node(i).r ; j != i ; j = mydlx.get_node(j).r)
            mydlx.del(mydlx.get_node(j).col);

        if(dfs()) return true;

        for(int j = mydlx.get_node(i).l ; j != i ; j = mydlx.get_node(j).l)
            mydlx.resume(mydlx.get_node(j).col);

        sta.pop();
    }
    mydlx.resume(col);
    return false;
}

int main(){
    std::cin >> n >> m;

    mydlx.init(m);
    for(int i=1;i<=n;++i){
        for(int j=1;j<=m;++j){
            int x;
            std::cin >> x;
            if(x)
                mydlx.add(i, j);
        }
    }

    // mydlx.print_row(1);
    if( dfs() )
    {
        for( int i = 0;i < sta.top ;i++)
        {
            std::cout << sta.a[i] << " ";
        }
        std::cout << "\n";
    }
    else
        std::cout << "No Solution!" << "\n";




    return 0;
}
