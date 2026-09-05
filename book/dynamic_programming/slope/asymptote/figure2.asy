settings.outformat = "svg";
size(8cm);

import graph;
import stats;

int height = 5;
int width = 5;

//创建两个坐标轴
xaxis("$x$",-3,5,arrow=Arrow);
yaxis("$y$",-3,5,arrow=Arrow);
int n = 10;
pair[] random_points = new pair[n];// = [(rand(),rand()) for i in range(100)];

real _random() {
    return Gaussrand() % (height-2) ;
}

for(int i = 0 ;i< n;i+=1) {
    // write(_random());
    random_points[i] = (_random(),_random());
    dot(random_points[i]);
}

real k = 1.4;
real b = -1.4;
real slope_line(real x) {
    return k*x + b;
}

int line_cnt = 3;
for(int i = 1;i<= line_cnt;i+=1) {
    path p = graph(slope_line, -1, 3);
    k = Gaussrand() % 100 ;
    b = -(Gaussrand() % 3) ;
    // Label label = "f1";
    draw(p,blue);
}