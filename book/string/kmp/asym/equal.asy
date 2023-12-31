//想等的传递性
//
//------------------
//|    |     |     |
//------------------
//
//
unitsize(1cm);
int s=1; //起点
int t=0; //起点y
int tot = 20; //总长度
int len1 = 3;
int len2 = 8;

int height=1;

pair start = (1,0);
pair end = (tot,height);


fill( box((s,0),(len2,height)),yellow );
fill( box((tot-len2+1,0),(tot,height)),yellow );


fill( box((s,0),(len1,height)),blue);
fill( box((len2-len1+1,0),(len2,height)),blue);


fill( shift((tot-len2,0)) * box((s,0),(len1,height)),blue);
fill( shift((tot-len2,0)) * box((len2-len1+1,0),(len2,height)),blue);

draw((s,height) -- (tot,height));
draw((s,0) -- (tot,0));

draw((s,0) -- (s,height));
draw((len1,0) -- (len1,height));
draw((len2-len1+1,0) -- (len2-len1+1,height));

draw((len2,0) -- (len2,height));
draw((tot-len2+1,0) -- (tot-len2+1,height));
draw((tot,0) -- (tot,height));

