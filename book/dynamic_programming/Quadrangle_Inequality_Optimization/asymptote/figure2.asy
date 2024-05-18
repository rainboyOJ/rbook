settings.outformat = 'svg';
size(8cm);

real h = 3;
real w1 = 3; //短边长
real w2 = 5; //长边长

pair a = (0,0);
pair b = (1.0,h);
pair c = (b.x+w1,h);
pair d = (w2,0);

dot(a);
dot(b);
dot(c);
dot(d);

draw(a--b--c--d--cycle);

label("$a$",a,W);
label("$b$",b,NW);
label("$c$",c,NE);
label("$d$",d,E);

path brace1 = shift((0,0.1)) *  brace(b,c,.2);
draw(brace1);

path brace2 = shift((0,-0.1)) *  brace(d,a,.2);
draw(brace2);

draw(b--d,dashed);
draw(a--c,dashed);


string s = "$len(a,c) + len(b,d) > len(a,d) + len(b,c)$";

pair t = ((a.x + d.x) / 2,-1);
label(s,t);