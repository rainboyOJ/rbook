settings.outformat = 'svg';
size(8cm);

import graph;

int W = 5;

//创建两个坐标轴
xaxis("$x$",-3,10,arrow=Arrow);
yaxis("$y$",-3,8,arrow=Arrow);

pair a = (1.0,1.0);

// real[] x_arr = {2,3,4};

int n = 5;
real k = 0.1;
real[] k_up = {0,0.1,0.5,0.8,1.0,2.5};
real gap = 1.5;

dot(a);

//经过点a,斜率为k的直线,在x位置的y值形成的点
pair ext_line(pair a ,real k,real x) {
    real b = a.y - k*a.x;
    real y = k*x + b;
    return (x,y);
}

for(int i = 1;i<=n;i+=1) {
    real x = a.x + gap;
    k = k_up[i];
    write(x);
    pair t = ext_line(a,k,x);
    dot(t);
    draw("$k_" + string(i) + "$",a--t);
    a = t;
}