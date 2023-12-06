// 线性规划1
// 证明 公式 z = y + k*x 在(x1,y1)有解时,
// 解为 直线 y = -kx + (x1*k + y1) 在y轴的截距
// 也就是 x 为 0 时的值

settings.outformat = "svg";
//unitsize(1cm);
size(13cm);
import graph;

// 这个asymptote 代码哪里有问题
// ```
pair[] points = {(1,2),(2,1),(5,6),(6,3)};

for( pair p : points) {
    dot(p);
}
// ```

// 创建一个闭包函数
real tp;
real k;
real b;
real f(real x) {
    // real b = -k*p.x + p.y; // k*x +y = z
    return k*x + b;
}

real ff(real x ){
    return sqrt(x);
}
// 绘制经过每个 points 的直线
int idx = 0;
for( pair p : points) {
    k = 1.5;
    b = -k*p.x + p.y; // k*x +y = z
    path g = graph(f,-2,3+idx);
    draw(g,dashed);
    ++idx;
}

xaxis("$x$",-10,10,arrow=Arrow);
yaxis("$y$",-10,10,arrow=Arrow);