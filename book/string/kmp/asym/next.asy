//创始next的图像
unitsize(1cm);
string P = "abababac";

real margin=0.2;
real len=1;

//draw-background
real lastx = (length(P) -1) *(len+margin)-margin/2;
real lasty = -(len+margin)-margin/2;
filldraw( box((lastx,lasty),(lastx+len+margin,lasty+2*len+2*margin)) ,gray,Dotted);
//defaultpen = fontsize(16pt);
defaultpen(fontsize(16pt));
void create_stirng_box(real xx,real yy,int s,int t) {
  for( int i = 0 ;i< length(P);++i){
    real x = xx+i*(len+margin);
    real y = yy;
    path rect = box((x,y),(x+len,y+len));
    if( i >= s && i <=t)
      filldraw(rect,green,Dotted);
      //filldraw(rect,red);
    else
      draw(rect);

    string subs = substr(P,i,1);
    label("$" + subs + "$",(x+len/2,y+len/2));
  }
}

create_stirng_box(0,0,2,6);
create_stirng_box(2*(len+margin),-(len+margin),0,4);


//shipout();
