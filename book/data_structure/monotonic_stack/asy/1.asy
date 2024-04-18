// This is the first example of monotonic stack in Asymptote.
import patterns;

// Asymptote: 1.asy
unitsize(1cm);
settings.outformat = "svg";

//创建多个连续的rect

// block bb = rectangle()

path draw_rect(int len,int height){
    path p = (0,0) -- (len,0) -- (len,height) -- (0,height) -- cycle;
    return p;
}

// currentpen = linewidth(0.1);

int[] a={1,5,4,3,2};
path[] path_a;
real padding = 0.5;

for(int i=0;i<a.length;++i){
    path p = draw_rect(1,a[i]);
    p = shift(i *(E+ (padding,0)) ) * p;
    path_a.push(p);
    draw(p);
}

real h = 2;
path line1 = (0,h) -- (10,h);
// draw(line1);

real[] insertion = intersect(line1,path_a[1]);
write(insertion[0]);
write(insertion[1]);
pair p1 = point(line1, intersect(line1,path_a[1])[0]);
pair p2 = point(line1, intersect(line1,path_a[3])[0]);
p1 = p1 - (1,0);
write(p1);
write(p2);
// dot(p1);
// dot(p2);
p1 = p1 - (0.2,0);
p2 = p2 + (0.2,0);
real top = a[1] + 0.2;
path rect = p1 -- p2-- (p2.x,top) -- (p1.x,top) -- cycle;
fill(rect,lightgray+opacity(0.5)+dashed);
draw(rect,dashed);

// draw((0,0) -- (1,0) -- (1,1) -- (0,1) -- cycle);