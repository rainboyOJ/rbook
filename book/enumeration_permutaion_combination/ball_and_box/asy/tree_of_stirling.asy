unitsize(1cm);
import flowchart;


real width = 4cm;
real height = 2cm;
real radius = 0.5cm;
pair center = (0, 0);

//draw(roundrectangle("123123",center,100,100));

real v_gap = 4;
real h_gap = 2.5;

struct node {
    pair pos; //节点的坐标
    string str; // 节点的文字
    Label l; // 节点的label

    //对应的组合
    int[][] comb; // 节点的组合
    //绘制的comb的颜色
    pen comb_color;
    pair comb_shift; // 节点的组合的相对pos的位置

    //构造函数
    void operator init(
        pair p,
        string str,
        int[][] comb,
        pen comb_color,
        pair comb_shift
    ) {
        this.pos = p;
        this.l = Label("$"+str+"$");
        for(int i = 0; i < comb.length; i+=1) {
            this.comb[i] = new int[];
            this.comb[i].append(comb[i]);
        }
        this.comb_color = comb_color;
        this.comb_shift = comb_shift;
    }
    
    //绘制节点
    void bound() {
        // write(str);
        real margin = 0;
        // 绘制每个图的文字
        // 获取label的边界框
        frame f;
        label(f,l,fontsize(32pt));
        // write(min(f),max(f));
        real len = max(f).x - min(f).x; 
        real height = max(f).y - min(f).y; 
        box(f);

        // 创建一个矩形，大小为label的边界框大小加上一些边距
        // pair topleft = (-len/2 - margin, height/2 + margin);
        // pair bottomright = (len/2 + margin, -height/2 - margin);
        // write(topleft);
        add(f,pos);

        // draw(shift(pos) * box(topleft, bottomright), blue);
        // draw(box(topleft, bottomright), blue);
    }


    pair comb_pos() {
        return pos + comb_shift;
    }
}
node[] a;
// 创建每个节点
node a1 = node((0,0),"S(4,2)",new int[][]{{1,2,3,4},{1,2,3,4}},cyan,E); 
node a2 = node((-h_gap,-v_gap),"S(3,2)",new int[][]{{1,2,3,4},{1,2,3,4}},green,5*W); 
node a3 = node((h_gap,-v_gap),"S(3,1)",new int[][]{{1,2,3}},red,5*E+0.5*S); 
node a4 = node((-h_gap - h_gap,-2*v_gap),"S(2,2)",new int[][]{{1},{2}},gray,6*W+0.5*S); 
node a5 = node((-h_gap + h_gap,-2*v_gap),"S(2,1)",new int[][]{{1,2}},blue,5*E+0.5*S); 
a.push(a1); //占用0号位置
a.push(a1);
a.push(a2);
a.push(a3);
a.push(a4);
a.push(a5);

for(int i=1;i<=5;i+=1) {
    a[i].bound();
}

//>>>>>>>>>>> 绘制边
path t;
path _sub_path(int i,int j) {
    real ratio = 5.0;
    t = a[i].pos -- a[j].pos;
    return  subpath(t,length(t)/ratio,length(t) - length(t)/ratio);
}

int[][] edge = {
    {1,2},
    {1,3},
    {2,4},
    {2,5},
};
for(int i = 0; i < 4;i+=1)
{
    int x = edge[i][0];
    int y = edge[i][1];
    write(x,y);
    draw(_sub_path(x,y),arrow=ArcArrow(HookHead,size=5));
}

//添加文字

//在frame上添加一行box,并在其中添加文字
//用来表示选中的球
// color_arr 指定每一个分组内球的颜色
frame add_box(int[][] arr,pen[][] color_arr,frame f) {
    pen p = fontsize(25pt);
    int gap = 10;
    int Sh = 20;
    for(int i = 0 ;i < arr.length ;i+=1 )
    {
        frame f2; // 一行的数据
        for(int j = 0 ;j < arr[i].length ;j+=1 )
        {
            frame f3;
            transform sh;

            label(f3,"$" + string(arr[i][j]) + "$",p);
            box(f3,color_arr[i][j],FillDraw,false);
            // sh = shift(max(f2).x + gap,0);
            if( j == 0)  //这一行的第一个
                sh = shift(0,0);
            else
                sh = shift(max(f2).x+gap,0);
            add(f2,sh* f3);
            write("max(f2),",i,j,max(f2).x);
            // label(f2,"&" + string(arr[i]),p);
        }
        // box(f2,color_arr[i],FillDraw,false);
        box(f2,5,5);
        //把这一行添加到f上面
        if( i == 0)
            add(f,f2 );
        else
            add(f, shift(max(f).x + 2*gap,0) * f2 );
    }
    return f;
}


void add_arrow(pair a,pair b,real ratio = 3.0){
    path t = a -- b;
    path st = subpath(t,length(t)/ratio,length(t) - length(t)/ratio);
    draw(st,arrow=ArcArrow(HookHead,size=5));
}

// 绘制组合

//那些直接绘制的组合
int[] direct_draw = {3,4,5};

for(int i = 0; i < direct_draw.length;i+=1)
{
    int t = direct_draw[i];

    frame f;
    pen[][] color_arr;
    for(int i = 0; i < a[t].comb.length;i+=1){
        color_arr.push(new pen[]);
        for(int j = 0; j < a[t].comb[i].length;j+=1){
            color_arr[i].push( a[t].comb_color);
        }
    }
    f = add_box(a[t].comb, color_arr, f);
    roundbox(f,10,10);
    add(f,a[t].comb_pos());
    add_arrow(a[t].pos,a[t].comb_pos());
}

//特别的绘制2号点
// 要么3单独一个盒子 S(3,2) = S(2,1) + [3]
{
    int v_gap = 20;
    frame total;
    //添加 [1 2] [3]
    int[][] x3  = {{1,2},{3}}; // 第一行
    pen[][] color_arr = {{a[5].comb_color,a[5].comb_color},{a[2].comb_color}};
    frame f;
    add_box(x3,color_arr,f);

    add(total,f);

    //添加 [1 3] [2]
    int[][] x3_2  = {{1,3},{2}}; // 第二行
    pen[][] color_arr2 = {{a[4].comb_color,a[2].comb_color},{a[4].comb_color}};
    frame f2;
    add_box(x3_2,color_arr2,f2);
    // write("max(total)",min(total),max(total));
    add(total,shift(0,min(total).y - v_gap)*f2);
    // write("after max(total)",min(total),max(total));

    // add_arrow(a[2].pos,a[2].comb_pos());

    //添加 [1] [2 3]
    int[][] x3_3  = {{1},{2,3}}; // 第二行
    pen[][] color_arr3 = {{a[4].comb_color},{a[4].comb_color,a[2].comb_color}};
    frame f3;
    add_box(x3_3,color_arr3,f3);
    write("max(total)",max(total).y);
    add(total,shift(0,min(total).y - v_gap)*f3);

    // add_arrow(a[2].pos,a[2].comb_pos());



    roundbox(total,10,10);
    add(total,a[2].comb_pos()+W+3*N);
    add_arrow(a[2].pos,a[2].comb_pos());
}

{

    //添加 1 号点的7行
    frame total;
    int v_gap = 20;
    //把数据加入到total里
    void add_to_total(int [][] arr,pen[][] color){
        frame f;
        add_box(arr,color,f);
        add(total,shift(0,min(total).y - v_gap)*f);
    }
    // 1: [1 2 4] [3] 
    int[][] x1  = {{1,2,4},{3}};
    pen[][] color_arr1 = {{a[5].comb_color,a[5].comb_color,a[1].comb_color},{a[2].comb_color}};
    add_to_total(x1,color_arr1);
    // 2: [1 3,4] [2]
    int[][] x2  = {{1,3,4},{2}};
    pen[][] color_arr2 = {{a[4].comb_color,a[2].comb_color,a[1].comb_color},{a[4].comb_color}};
    add_to_total(x2,color_arr2);

    // 3: [1 4] [2,3]
    int[][] x3  = {{1,4},{2,3}};
    pen[][] color_arr3 = {{a[4].comb_color,a[1].comb_color},{a[4].comb_color,a[2].comb_color}};
    add_to_total(x3,color_arr3);

    // 4: [1 2] [3 4] 
    int[][] x4  = {{1,2},{3,4}};
    pen[][] color_arr4 = {{a[4].comb_color,a[4].comb_color},{a[2].comb_color,a[1].comb_color}};
    add_to_total(x4,color_arr4);
    // 5: [1 3] [2 4]
    int[][] x5  = {{1,3},{2,4}}; 
    pen[][] color_arr5 = {{a[4].comb_color,a[2].comb_color},{a[4].comb_color,a[1].comb_color}};
    add_to_total(x5,color_arr5);
    // 6: [1] [2 3 4]
    int[][] x6  = {{1},{2,3,4}}; 
    pen[][] color_arr6 = {{a[4].comb_color},{a[4].comb_color,a[2].comb_color,a[1].comb_color}};
    add_to_total(x6,color_arr6);
    // 7: [1 2 3] [4]
    int[][] x7  = {{1,2,3},{4}};
    pen[][] color_arr7 = {{a[4].comb_color,a[4].comb_color,a[2].comb_color,},{a[1].comb_color}};
    add_to_total(x7,color_arr7);

    roundbox(total,10,10);
    add(total,a[1].comb_pos()+5*E+10*N);
    add_arrow(a[1].pos,a[1].comb_pos()+5*E+3*N,5.5);
}



//添加padding
frame bf = bbox(40,40,white);
picture p2 = new picture;
add(p2,bf);
currentpicture = p2;