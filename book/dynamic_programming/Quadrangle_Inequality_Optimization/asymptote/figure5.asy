settings.outformat = 'svg';
size(8cm);
import graph;

int h1 = 0;

void draw_axis(int height, int width, pen p =defaultpen)  {
    draw((-1.5,height)--(width,height),p,Arrow);
}

draw_axis(h1,12);

real[] points = {0,1.5,3.5,5,7,10};
string[] names = {"$0$","$j$","$p$","$i$","$i^{'}$","$N$"};

for(int i =0;i< points.length ;i+=1 ) {
    pair p = (points[i],h1);
    dot(p);
    label(names[i],p,NW);
}

pair p = (points[3],h1);
pair f1 = p + (0,3);
dot(f1);
label(f1,"$f(i)$",NW);
draw(f1 --p,dashed,arrow=Arrow(TeXHead));
//draw((points[3],h1) -- (points[3],h2),dashed,arrow=Arrow(TeXHead));

void line_point_up(int i,int j,real h) {

    real middlex = (points[i] + points[j])/2;
    real middley = h;
    draw((points[i],h1){up} :: (middlex,middley){right} :: (points[j],h1){down},red);
}

void line_point_down(int i,int j,real h) {

    real middlex = (points[i] + points[j])/2;
    real middley = h;
    draw((points[i],h1){down} :: (middlex,middley){right} :: (points[j],h1){up},blue);
}

line_point_up(1,4,1.5);
line_point_up(2,3,1);

line_point_down(1,3,-1.2);
line_point_down(2,4,-1.2);
