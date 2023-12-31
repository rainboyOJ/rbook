//分级背包的模型 


template<int MaxCap = 10000>
struct  group_backpack
{
    int C = MaxCap; //最大容量
    int F[MaxCap]; //

    using stuffType = struct  { int w,v };
    using groupStuffType = stuffType *;
    
    
    //处理一组物品
    void work_one_group(groupStuffType stuffs,int size){
        for(int k = C ; k>= 0 ; --k) {
            work(stuffs,size,k);
        }
    } 

    //一组物品,在容量c下的答案
    void work(groupStuffType stuffs,int size ,int c) {
        for (int i = 0; i < size; ++i)
        {
            if (c >= stuffs[i].w)
                F[c] = std::max(F[c], F[c - stuffs[i].w] + stuffs[i].v);
        }
    }

    //处理多组物品
    // void deal_groups(,int size)
    // TODO 不好指定参数 
};
