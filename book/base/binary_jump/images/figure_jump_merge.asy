// 创建一个连接的点
unitsize(1cm);
// import patterns; //asy的pattern模块,p44
// add("tile",tile());
// margin(10); // 设置边距为10单位  
settings.outformat = "svg";
// settings.outformat = "png";

int width = 10;
int height = 10;
int gap = 3;
real R = 1;

pair circle_pos(int idx) {
    real x = idx*R;
    real pos = x;
    if( x > 0)
        pos = x * gap + x;
    return (pos,0);
}

path draw_circle(pair pos) {
    return circle(pos, R);
}

int n = 10;
int start = 2;
int end = 8; // 终点

for(int i = 0; i < n; ++i) {  
    // path rect = draw_square(i*2, 0);
    pair center = circle_pos(i); 
    path Cir = draw_circle(center);

    int idx =  i+1;

    if ( idx == start ||idx== end) {
        filldraw(Cir,green);
        pair pos = point(Cir,2.5);
    }
    else if( idx < end)
    {
        draw(Cir);
    }
    else {
        filldraw(Cir,red);
    }
    label(string(i+1)+"",center);

    //draw arrow
    if( i > 0) {
        pair p1 = circle_pos(i-1)+R;
        pair p2 = circle_pos(i)-R;
        draw(p1 -- p2,arrow=Arrow(),margin=Margin);
    }
    if( i < n-2) {
        pair p1 = circle_pos(i) + (0,R);
        pair p2 = circle_pos(i+2) + (0,R);
        pair center = ( (p1.x+p2.x)/2 , (p1.y+p2.y)/2) - (0,4*R);

        path _arc = arc( center, p1, p2,direction=CW);
        draw(_arc,blue,arrow=Arrow());
    }
    if( i < n-4) {
        pair p1 = circle_pos(i) - (0,R);
        pair p2 = circle_pos(i+4) - (0,R);
        pair center = ( (p1.x+p2.x)/2 , (p1.y+p2.y)/2) + (0,6*R);

        path _arc = arc( center, p1, p2,direction=CCW);
        draw(_arc,red,arrow=Arrow());
    }
}  
