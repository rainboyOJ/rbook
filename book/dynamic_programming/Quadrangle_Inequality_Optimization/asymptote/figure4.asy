settings.outformat = 'svg';
size(8cm);
import graph;

// xaxis("$x$",-3,5,arrow=Arrow);

int h1 = 0;
int h2 = -2;


void draw_axis(int height, int width, pen p =defaultpen)  {
    draw((-1.5,height)--(width,height),p,Arrow);
}

draw_axis(h1,6);
draw_axis(h2,6);


real[] points = {0,1,5,3.5};
string[] names = {"$i$","$i+1$","$j$","$p$"};

for(int i =0;i< points.length ;i+=1 ) {
    pair p = (points[i],h1);
    dot(p);
    label(names[i],p,NW);
}

for(int i =0;i< points.length ;i+=1 ) {
    pair p = (points[i],h2);
    dot(p);
    label(names[i],p,NW);
}


void draw_square_brace(real h,real x, real y,pen p) {
    int height = 1;
    pair a = (x,h);
    pair b = (y,h);
    path p1 = a -- (a.x,a.y+ height) -- (b.x,a.y+ height) -- b;
    draw(p1,p);
}

draw_square_brace(h1,points[1],points[2],defaultpen);
draw_square_brace(h2,points[0],points[2],defaultpen);

draw((points[3],h1) -- (points[3],h2),dashed,arrow=Arrow(TeXHead));
//draw((points[1],h1) -- (points[1],h2),dashed,arrow=Arrow(TeXHead));


//path indicator = b--c;
//draw(shift((0,0.5)) * indicator,dashed,arrow=Arrow(TeXHead));

pair i = (points[0],h2);
pair p1 = (points[3],h2);
pair j = (points[2],h2);

pair p1_1 = p1 + (0.8,0);
dot(p1_1);

path b1 = shift((0,-0.3)) * brace(j,p1_1) ;
draw(b1);
label("can not",b1,S);

label("$p-1$",p1_1,N);
path b2 = shift((0,-0.3)) * brace(p1,i) ;
draw(b2);
label("can",b2,S);