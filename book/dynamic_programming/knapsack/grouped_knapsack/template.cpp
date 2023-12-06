// desc: 分组背包的模板代码
// author:rainboy 
// date: 2023/4/26

#define FOR(i,a,b) for(int i = a ; i<= b; ++i)
#define rFOR(i,a,b) for(int i = a ; i>= b; --i)


// cap 背包的容量
template<int Cap,int MaxStuff>
struct groupKnapsack {
   long long f[Cap+5]; //f[i] 在容量为i的条件下得到的最大值

   struct stuff { int w,v; }; //一个物品的重量与价值
   int stuff_size;
   stuff stuffs[MaxStuff+5]; //存一组物品

   //清空一组背包
   void clear() { stuff_size = 0;}

   //添加一个物品 
   void push(int w,int v){
        stuffs[++stuff_size] = {w,v};
   }

   // 处理一个物品
   void deal_one_stuff(int v,int w,int c){
        if( c < w ) return; //容量不够
        if( f[c] < f[c-w]+v) f[c] = f[c-w]+v;
   }

   //处理一组物品
   void deal_one_group_stuff() {
        rFOR(C,Cap,0) // 容量 大->小
            FOR(i,1,stuff_size) //枚举物品 
                deal_one_stuff(stuffs[i].v,stuffs[i].w,C);
   }

   //得到答案
   long long ans(int cap=Cap) {
       return f[cap];
   }
};