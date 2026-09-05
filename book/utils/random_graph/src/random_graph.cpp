//这里我封装了一个类，可以用来生成随机无向图
// 同时它也可以生用生成随机的dag
#include <bits/stdc++.h>

//随机double
class random_double {

public:
    random_double(double l=0,double r=1)
    :   rnd( std::random_device{}()),
        dis(l,r)
    {} 

    double operator()() {
        return dis(rnd);
    }
private:
    std::mt19937 rnd;
    std::uniform_real_distribution<> dis;

};


class random_graph {

public:
    using edge  = std::pair<int,int>;

    //是不是无向图
    random_graph(int n,double p)
    : rnd(0,p),_p(p),_n(n),_m(0)
     {}

    //生成图
    void generator(){
        //任意两者点间的关系
        for(int i =1;i<=_n;i++) {
            for(int j = i+1;j<=_n;j++)
            {
                if( rnd() <= _p) 
                {
                    ++_m;
                    _edges.emplace_back(i,j);
                }
            }
        }
    }
    
    int n() const { return _n;}    
    int m() const { return _m;}    

    void print_nodes() {
        //TODO
    }

    //输出所有的边
    void print_edges() {
        // for( auto  &e : _set) {

        // }
        // for( auto it = _set.begin() ; it != _set.end();++it)
        // {
        //     std::cout << it->first << " " << it->second << '\n';
        // }
        std::for_each(_edges.begin(),_edges.end(),[](auto &e){
            std::cout << e.first << " " << e.second << '\n';
        });
    }


private:

    double _p; //存在边的概率
    int _n;//点的数量 
    int _m; 
    // std::set<std::pair<int,int>> _set;// 用来判断边<u,v>是否存
    std::vector<edge> _edges;
    random_double rnd;
};

int main(){
    random_graph rg(3,0.5);
    rg.generator();
    std::cout  << rg.n() << " ";
    std::cout  << rg.m() << "\n";
    rg.print_edges();
    return 0;
}