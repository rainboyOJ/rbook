// 画证明: 交换两个相邻的位置
import patterns;

unitsize(1cm);
settings.outformat = "svg";
// settings.outformat = "pdf";

add("tile",tile());
add("checker",checker());

int gap = 1;

path rect(int x,int y,int w,int h) {
    return (x,y) -- (x+w,y) -- (x+w,y+h) -- (x,y+h) -- cycle;
}


// 每个点的长度
int[] arr = {1,2,3,4,5};
int[] arr2 = {1,2,4,3,5};
path[] rects;
int s1 = 3,s2=4; //交换的两个点
// string[] arr_name = {"a1",2,3,4,5};

// void draw_rects(int x,int y,int[] arr) {
// //绘制
// }


int x = 0,y=0; //起点
for(int i = 0; i < arr.length; ++i) {
    path rect = rect(x,y,arr[i],1);
    if( i+1 == s1 || i+1 == s2) {
        filldraw(rect,pattern("checker"));
        label(point(rect,0.5)+S*0.3,i+1 == s1 ? "s1" : "s2");
    }
    else draw(rect);
    rects.push(rect);
    x += arr[i];
    x += gap;
}

x = 0;
y=-2; //起点
for(int i = 0; i < arr2.length; ++i) {
    path rect = rect(x,y,arr2[i],1);
    if( i+1 == s1 || i+1 == s2) {
        filldraw(rect,pattern("checker"));
        label(point(rect,0.5)+S*0.3,i+1 == s1 ? "s2" : "s1");
    }
    else draw(rect);
    rects.push(rect);
    x += arr2[i];
    x += gap;
}