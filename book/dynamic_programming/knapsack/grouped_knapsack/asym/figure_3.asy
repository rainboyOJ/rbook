// 生成第一个图: 二维解法的求解答顺序
settings.outformat="svg";
settings.prc = false;
settings.render = 0;
// settings.resolution = 300;
unitsize(2cm);

import patterns;
add("hatch",hatch());

real cellWidth = 2;
real cellHeight = 1;
real groupSep = 3;
int numStuf = 5;

pen P = defaultpen();
defaultpen(P+ fontsize(20pt));

void draw_one_group_object(string group_idx,pair Point){

    real X = Point.x;
    real Y = Point.y;

    draw( (X,Y)--(X,Y+numStuf*cellHeight));
    draw( (X+cellWidth,Y)--(X+cellWidth,Y+numStuf*cellHeight));

    //title
    label(group_idx, (X+cellWidth/2,Y-cellHeight+cellHeight/2));

    for(int i = 0 ;i<= numStuf ;++i){
        draw( (X,Y+cellHeight*i)--(X+cellWidth,Y+cellHeight*i) );
        //写字
        if( i == numStuf) break;
        // label(o1[i].to_string(),(X+cellWidth/2,Y+i*cellHeight+cellHeight/2));
        label(
            format("$%d$",numStuf- i),
            (X+cellWidth/2,Y+i*cellHeight+cellHeight/2)
            );
    }
}

real rect_w = 1;
real rect_h = 0.3*cellWidth;
real rect_sep = 0.5;
int rect_cnt_a_line = 5;

//用颜色fill 第i组第j个数组
//得到ij 这个物品的坐标
pair pair_stuff_ij_left(int i,int j) {
    real X = i * (cellWidth+groupSep);
    real Y = 0;
    return (X,Y+(numStuf-j)*cellHeight + cellHeight/2);
}

pair pair_stuff_ij_right(int i,int j) {
    pair p = pair_stuff_ij_left(i,j);
    return (p.x+cellWidth,p.y);
}

// 得到f[i][w] 起始位置
pair get_one_fij_pos(int i,int j) {
    pair ST = pair_stuff_ij_right(0,i)+(1,-cellHeight/3);
    return (ST.x+ j *(rect_w+rect_sep),ST.y);
}

//画一行rect, 第i行,cnt个rect
void draw_one_line_rect(int line) {
    for( int i =0 ;i< rect_cnt_a_line;++i) {
        pair s = get_one_fij_pos(line,i);
        pair t = s+ ( rect_w,rect_h);
        draw(box(s,t));
    }
}

//绘制二组
draw_one_group_object("$Group\ i$" ,(0 * (cellWidth+groupSep),0));



// shipout( bbox(0.25cm,0.25cm) );
pen fillpen = mediumgray;



//从第二行开始画
for( int i = 2 ;i<= 5;++i) {
    draw_one_line_rect(i);
    /*
    for( int j = 1;j<=4;++j) {
        pair a = pair_stuff_ij_right(0,j)+(1,-cellHeight/3) 
            + (rect_w/2+(i-1)*(rect_w + rect_sep),0);
        pair b = a + (0,-cellHeight/3);
        draw(a .. b ,arrow= Arrow());
    }
    */
}


for(int i =1;i<=5;++i) {
    pair pos = pair_stuff_ij_right(0,1)+(1,cellHeight/2)
            + (rect_w/2+(i-1)*(rect_w + rect_sep),0);
    label(format("$w_%d$",i),pos);
}

//第一行w加上 背景  
for(int i =0 ;i<rect_cnt_a_line;++i){
    pair s = get_one_fij_pos(1,i);
    filldraw(box(s,s +(rect_w,rect_h)),pattern("hatch"));
    // filldraw(box(s,s +(rect_w,rect_h)));
}

// 动态的处理每个物品的过程
for(int i =1;i<=5;++i) {
    pair pos_stuf = pair_stuff_ij_right(0,i);
    // for(int j = 0; j )
}

//创建一个Pic 将 current 加入到Pic上



// attach(pic,currentpicture.fit());
// size(pic,currentpicture.xsize,currentpicture.ysize);
for( int i =1;i<=5;++i) { //每个stuf
    pair p1 = pair_stuff_ij_right(0,i);
    picture pic = currentpicture.copy();
    for( int j = 0;j<rect_cnt_a_line;++j) {
        pair p2 = get_one_fij_pos(2,j);
        p2 = p2 + (rect_w/2,rect_h);
        if( i > 1) {
            p2 = p2 + (0,-rect_h);
        }
        path s;
        if( i == 1)
            s = p1{right} .. {down}p2;
        else
            s = p1{right} .. {up}p2;
        draw(pic,s,arrow=Arrow(TeXHead));
    }
    shipout(format("figux_%d.svg",i),pic);
}
