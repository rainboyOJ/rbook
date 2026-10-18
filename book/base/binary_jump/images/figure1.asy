unitsize(1cm);
// import patterns; //asy的pattern模块,p44
// add("tile",tile());
// margin(10); // 设置边距为10单位  
// settings.outformat = "svg";
// settings.outformat = "png";

int width = 10;
int height = 10;
int gap = 10;
//创建一行 rect
// for (int i = 0; i < 10; ++i) {
//     // draw((0, i * 50), (500, i * 50));
//     // draw(shift(i * gap, 0) * unitsquare);
//     draw(unitsquare);
// }

path draw_square(int x,int y) {
    return shift(x, 0) * unitsquare; // 每个正方形的横坐标增加1  
}

int n = 10;
int start = 2;
int end = 8; // 终点

for(int i = 0; i < n; ++i) {  
    path rect = draw_square(i*2, 0);
    pair w = point(rect,0.5);
    label(string(i+1)+"",w,S*2);

    int idx =  i+1;

    if ( idx == start ||idx== end) {
        string str = idx == start ? "$x$" : "$y$";
        filldraw(rect,green);
        pair pos = point(rect,2.5);
        label(str,pos,N*2);
    }
    else if( idx < end)
    {
        draw(rect);
    }
    else {
        filldraw(rect,red);
    }
}  