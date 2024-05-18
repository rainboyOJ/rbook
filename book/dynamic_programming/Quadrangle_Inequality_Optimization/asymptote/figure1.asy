settings.outformat = 'svg';
size(8cm);


//xaxis("$x$",-3,10,arrow=Arrow);

draw( (0,0) -- (10,0),Arrow);

pair[] point  =  new pair[4];
string[] name = {"$a$","$b$","$c$","$d$"};
real start  = 1;
real gap = 2.5;
for(int i = 0;i < 4;i+=1) {
    point[i] = (start + i *gap,0);
    dot( point[i]);
    label(name[i],point[i]+ 0.5*S);
}


void line_point_up(int i,int j,real h) {

    real middlex = (point[i].x + point[j].x)/2;
    real middley = h;
    draw(point[i]{up} :: (middlex,middley){right} :: point[j]{down},red);
}

void line_point_down(int i,int j,real h) {

    real middlex = (point[i].x + point[j].x)/2;
    real middley = h;
    draw(point[i]{down} :: (middlex,middley){right} :: point[j]{up},blue);
}

line_point_up(0,3,1.5);
line_point_up(1,2,1.2);

line_point_down(0,2,-1.2);
line_point_down(1,3,-1.2);

pair t = (( point[1].x + point[2].x) / 2, -3);
label("$W(a,c) + W(b,d) \leq W(a,d)+ W(b,c)$",t);