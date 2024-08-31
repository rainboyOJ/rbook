unitsize(1cm);

real v_gap = 4;
real h_gap = 2.5;

struct node {
    pair pos;
    string str;
    Label l;
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
}
node[] a;
for(int i =1;i<=10;i+=1)
    a.push(new node);

a[1].str = "S(4,2)";
a[1].pos = (0,0);

a[2].str = "S(3,2)";
a[2].pos = (-h_gap,-1*v_gap);

a[3].str = "S(3,1)";
a[3].pos = (h_gap,-1*v_gap);

a[4].str = "S(2,2)";
a[4].pos = (-h_gap - h_gap,-2*v_gap);

a[5].str = "S(2,1)";
a[5].pos = (-h_gap + h_gap,-2*v_gap);

for(int i=1;i<=5;i+=1) {
    a[i].l = Label("$"+a[i].str +"$");
    // label(a[i].l,a[i].pos,fontsize(32pt));
    a[i].bound();
}

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

//在frame上添加[]
frame add_box(int[] arr) {
    frame f;
    for(int i = 0 ;i < arr.length ;i+=1 )
    {
        path r = shift(E*i*30) * scale(20)* unitsquare;
        draw(f,r);
        label(string(arr[i]),( (E*i*30).x,5),fontsize(30pt));
        write(arr[i]);
    }
    return f;
}

int[] x  = {1,2,3,4};
frame f = add_box(x);
add(f);