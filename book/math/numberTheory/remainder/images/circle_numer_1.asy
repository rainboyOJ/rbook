import graph;
unitsize(1cm);
int n = 8;  // 数字的个数
real R = 2; // 圆的半径

for (int i = 0; i < n; ++i) {
    real angle = 360-360 / n * i + 90; // clockwise
    pair position = R * dir(angle);
    label("$" + string(i) + "$", position);
}

pair origin = (0,0);
path circle1 =  scale(R*0.8)*unitcircle;
path circle2 =  scale(R*1.2)*unitcircle;
draw(circle1);
draw(circle2);

for (int i = 0; i < n; ++i) {
    real angle = 360-360 / n * i + 90 + 360/(2*n); // clockwise
    pair position = R*2 * dir(angle);
    path tmp = origin -- position;
    pair t1 = point(circle1,intersect(circle1,tmp)[0]);
    pair t2 = point(circle2,intersect(circle2,tmp)[0]);
    // dot(t1);
    // dot(t2);
    draw(t1--t2);
    //label("$" + string(i) + "$", position);
}

path arc_clockwise = arc(origin,0.8*R,90,0);
draw("clockwise",arc_clockwise,blue,Arrow);