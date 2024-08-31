int n; //总共有多少行
//数据,二维数组
//从in文件里读取数据
//

// 是左下解的位置为(0,0)

//单位长度
int base_len = 2;
int node_sep = 2*base_len;

//每个点的位置
double[][] node_pos;


//定位
pair postion(int x,int y) {
    return (x * base_len,y * base_len);
}

//计算每个点的位置
for(int i = n;i>=1;i-=1)
{
    for(int j = 1; j <= i;j+=1)
    {
        node_pos[i][j].y = node_sep * i ;
        if( i == n && j == 1) { //第一个元素
            node_pos[i][j].x = 0;
        }
        else if ( j == 1) {
            node_pos[i][j].x = node_pos[i+1][j].x +  node_sep*1.0 / 2;
        }
        else
            node_pos[i][j].x = node_pos[i][j-1].x + node_sep;
    }
}

//绘制一个点
void draw_node(int x,int y,int num)
{
    pos = postion(x,y);
    circle()
    text()
}

//绘制点
for(int i =1;i <= n;i+=1) {
    for(int j = 1 ;j <= i;j++) {
        draw_node(x,y,num);
    }
}

//绘制所有的连线
for(int i =1;i < n;i+=1) {
    for(int j = 1 ;j <= i;j++) {
        draw( node_pos[i][j] -- node_pos[i+1][j],Arrow);
        draw( node_pos[i][j] -- node_pos[i+1][j+1],Arrow);
    }
}
