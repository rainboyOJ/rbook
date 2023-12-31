// 生成第一个图: 三维解法的图
settings.outformat="svg";
settings.prc = false;
settings.render = 0;
// settings.resolution = 300;
unitsize(2cm);

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

//绘制二组
draw_one_group_object("$Group\ i-1$" ,(0 * (cellWidth+groupSep),0));
draw_one_group_object( "$Group\ i$",(1 * (cellWidth+groupSep),0));

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


// shipout( bbox(0.25cm,0.25cm) );
pen fillpen = mediumgray;

//[2][3] --> [1][5] 
path s1 = pair_stuff_ij_left(1,3){left} .. {left}pair_stuff_ij_right(0,5);
draw( s1,
    L= Label("$f[i-1][total(i-1)][w]$",align=(0,0),fontsize(9pt),position=MidPoint,filltype=Fill(fillpen)),
    // ,position=MidPoint,align=(0,0),filetype=NoFill),
    arrow=Arrow(TeXHead),blue+1.5,margin=TrueMargin(1.5,0.5*1.5));

path s2 = pair_stuff_ij_right(1,1)+(0,cellHeight/2) -- pair_stuff_ij_right(1,2)+(0,-cellHeight/2);

draw(shift(0.2)*s2,arrow=Arrows(),bar=Bars);

path s3 = pair_stuff_ij_right(1,3){right} .. {left}pair_stuff_ij_right(1,1) + (0.2,-cellHeight/2);

Label l2 = Label("$f[i][j-1][w]$",align=0E,fontsize(9pt),position=MidPoint,filltype=Fill(fillpen));
draw(s3,arrow=Arrow(TeXHead),blue+1.5,margin=TrueMargin(1.5+0.5*1.5),L=l2);

//创建了第一个图片,每组物品一列
shipout();