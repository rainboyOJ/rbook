
// draw a circle

// size(15cm);
unitsize(1cm);
// draw(f,circle((0,0), 1));
/*
frame f;
box(f,"hello");
f = shift((12,2))*f;
add(f);
*/


//添加一个pic
picture pic1;
unitsize(pic1,1cm);
// draw(pic1,circle((0,0),1));
pair A, B, C, D;
A = (0, 0);
B = (4, 0);
C = (4, 2);
D = (0, 2);
draw(pic1,A--B--C--D--cycle);
dot(pic1,"$A$", A, SW);
dot(pic1,"$B$", B, SE);
dot(pic1,"$C$", C, NE);
dot(pic1,"$D$", D, NW);
draw(circle((0,0), 1));

add(pic1.fit(),(10,0));
