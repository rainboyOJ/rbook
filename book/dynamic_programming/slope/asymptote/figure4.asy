settings.outformat = 'svg';
size(8cm);

import graph;

int W = 5;

//创建两个坐标轴
xaxis("$x$",-3,5,arrow=Arrow);
yaxis("$y$",-3,5,arrow=Arrow);


pair a = (2.0,1.2);
pair b = (4.0,2.7);

dot(a);
dot(b);
draw("$k_1$",a--b,NW);
label("$a$",a,NW);
label("$b$",b,NW);


//经过点a,斜率为k的直线
pair ext_line(pair a ,real k,real x) {
    real b = a.y - k*a.x;
    real y = k*x + b;
    return (x,y);
}

path p1 = ext_line(a,2.5,0.5) -- ext_line(a,2.5,3.5);
Label label_1 = Label("$l_1$",EndPoint);
draw(label_1,p1,dashed);

path p2 = ext_line(a,0.3,0.5) -- ext_line(a,0.3,4.5);
Label label_2 = Label("$l_2$",EndPoint);
draw(label_2,p2,dashed);
