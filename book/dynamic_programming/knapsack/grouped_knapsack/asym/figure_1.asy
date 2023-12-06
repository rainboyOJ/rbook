// 生成第一个图:每组物品
settings.outformat="svg";
settings.prc = false;
settings.render = 0;
// settings.resolution = 300;
unitsize(2cm);

struct object {
    int u,v;
    string to_string(){
        return format("$%d",this.u) + "\ \ " +format("%d$",this.v);
    }
};
object[][] data;

//数据读取 
file fin = input("in");
int n = fin; //n组数据
for(int i=1;i<=n;++i){
    object[] t; //创建一个临时的object数组
    int k = fin;
    for(int j =1;j<=k;++j){
        object tt;
        tt.u = fin;
        tt.v = fin;
        t.push(tt);
    }
    data.push(t);
}

// 创建一列 矩形

real cellWidth = 2;
real cellHeight = 1;
real groupSep = 3;

//设定pen为thin
pen P = defaultpen();
defaultpen(P+ fontsize(20pt));

//绘制一组物品
void draw_one_group_object(object[] ox,pair Point = (0,0) ,string title = ""){

    object[] o1 ;
    for(int i = ox.length-1 ;i >=0 ; --i ) {
        o1.push(ox[i]);
    }

    real X = Point.x;
    real Y = Point.y;

    draw( (X,Y)--(X,Y+o1.length*cellHeight));
    draw( (X+cellWidth,Y)--(X+cellWidth,Y+o1.length*cellHeight));

    //title
    label(title,
        (X+cellWidth/2,Y-cellHeight+cellHeight/2));

    for(int i = 0 ;i<= o1.length ;++i){
        draw( (X,Y+cellHeight*i)--(X+cellWidth,Y+cellHeight*i) );
        //写字
        if( i == o1.length) break;
        label(o1[i].to_string(),(X+cellWidth/2,Y+i*cellHeight+cellHeight/2));
        label(
            format("$%d\ :$",o1.length - i),
            (X,Y+i*cellHeight+cellHeight/2),
            1W
            );
        // label("$f(x)$",(0,i*cellHeight));
    }
}

//绘制每一组
for( int i = 0 ;i< data.length ; ++i) {
    draw_one_group_object(
        data[i],
        (i * (cellWidth+groupSep),0),
        "$Group\ " + format("%d$",i+1)
        );
}

//用颜色fill 第i组第j个数组
void color_fill_ij() {

}

// shipout( bbox(0.25cm,0.25cm) );

//创建了第一个图片,每组物品一列
shipout();