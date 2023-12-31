settings.outformat = "svg";
size(10cm);

import graph;


xaxis("$x$",-3,5,arrow=Arrow);
yaxis("$y$",-3,5,arrow=Arrow);

pair A = (2,2);
real k = 1.5;
real b = A.y - k * A.x;

real f(real x )
{
    return k*x + b;
}

pair intersection_x  = (0-b/k,0);
pair intersection_y = ( 0, f(0));

Label label = Label("$y=1.5*x + b$",position=EndPoint,align=2E,p=black);
draw(graph(f,-1,3),blue+1pt,L = label);
dot(A);
label("$A$",A,align=N+W);

path p_d = (0,0) -- intersection_y ;
draw(p_d,red + 2bp);

dot(intersection_x);
dot(intersection_y);

Label lb = Label("$d$",position=MidPoint,align=W+0.2N);
draw(shift(-0.1,0) * brace(intersection_y,(0,0)),red,L=lb);
margin ArrowMrgin = TrueMargin(2,2);
// draw(shift(-0.1,0) * p_d,red, arrow= Arrows(),bar=Bars,L=lb,
// margin=ArrowMrgin);