settings.outformat = 'svg';
size(8cm);

import graph;

int W = 5;

//创建两个坐标轴
xaxis("$x$",-3,5,arrow=Arrow);
yaxis("$y$",-3,5,arrow=Arrow);


pair a = (1.0,0.2);
pair b = (2.0,1.7);
pair c = (4.0,2.2);

dot(a);
dot(b);
dot(c);
draw("$k_1$",a--b,NE);
draw("$k_2$",b--c,2N+E);
draw("$k_3$",a--c,SE,dashed);
label("$a$",a,NW);
label("$b$",b,NW);
label("$c$",c,NE);


//线一条线
path tmp_line = (-1.1,-2) -- (5,1);
draw("$line1$",tmp_line,blue);

shipout("figure3_1",currentpicture);

//k1 延长线

//得到两个点的斜率
real get_k(pair a,pair b){
    return (b.y - a.y) / (b.x - a.x);
}

real k = get_k(a,b);

//给定直线上的两个点的坐标 a,b
//和一个x坐标值,问这个直线上对应x位置的y的值是什么
real query_y(pair a,pair b,real x) {
    real k = get_k(a,b);
    real b = a.y - k * a.x;
    // 求截距
    return k*x + b;
}

pair e = (c.x,query_y(a,b,c.x));

draw(b--e--c,dashed);
dot(e);
label("$e$",e,NE);


pair f = (a.x, query_y(b,c,a.x));
draw(a--f--b,dashed);
dot(f);
label("$f$",f,NW);