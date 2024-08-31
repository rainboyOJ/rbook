// 创建一行格子
settings.outformat="svg";
unitsize(1cm);

int i = 3;
int j = 9;
int tot = 10; //总长度
int len = 1; //格子的长度

//绘制多个格子
int margin = 1;

defaultpen(fontsize(15pt));

for(int s = 1 ; s <= tot; ++s)
{
  int x = (s-1) * (len+margin);
  int y = 0;
  int endx = x + len;
  int endy = y + len;
  path rec = box((x,y),(endx,endy));
  if( s > i && s < j)
    filldraw(rec,yellow,black + linewidth(2));
  else if( s == i || s == j)
    filldraw(rec,yellow,blue+ linewidth(2));
  else
    draw(rec,linewidth(2));
  //draw label
  label(string(s),(x+len/2,y),align=2S);
}

pair start_pos = ( (i-1)*(len+margin) + len /2, len+len/2);
pair end_pos = ( (j-1)*(len+margin) + len /2, len+len/2);

Label l= Label("$dis\_in$",align=(0,1),position=MidPoint);
draw(start_pos -- end_pos,L=l,arrow=Arrows(),bar=Bars);
