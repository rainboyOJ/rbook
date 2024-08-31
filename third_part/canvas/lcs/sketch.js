//全局变量

const startX = 120
const startY = 120
const Width= 60
const max_length = 8

//字符串
var stra = "abcd"
var strb = "abcedd"

//二维数组,存值与前趋 
// [ {f,pre}]
var info = []

const UP = 0
const LEFT = 1
const UL = 2

const symbol = ['⬆','⬅','↖'] 

function setLineDash(list) {
  drawingContext.setLineDash(list);
}

function draw_cell(i,j,msg) {
  // i是第i行,所以对应是y坐标
  let x = startX + (j-1)*Width
  let y = startY + (i-1)*Width

  setLineDash([])
  stroke(255, 0, 0)
  fill(255,255,255)
  rect(x, y, Width, Width);
  {
      fill(0)
      stroke(255,0,0,50)
      setLineDash([3,3])
      line(x,y+Width/2,x+Width ,y+Width/2)
      line(x+Width/2,y,x+Width/2 ,y+Width)

      
      textSize(Width/4)
      text(info[i][j].f,x+Width/2 +Width/4,y+Width/2 +Width/4)

      if( i == 0 || j == 0) return;

      let pre = info[i][j].pre
      if( pre === UP)
        text(symbol[pre],x+Width/2 +Width/4,y+Width/4)
      else if( pre === LEFT)
        text(symbol[pre],x+Width/4,y+Width/2 +Width/4)
      else if( pre === UL)
        text(symbol[pre],x+Width/4,y+Width/4)
  }

}

//计算，得到lcs的数据,存在info里
function calc_lcs(sa,sb)
{
  let la = sa.length
  let lb = sb.length
  info = []
  for(let i = 0;i <= la;i++)
  {
    info.push(new Array(lb + 1).fill({ f: 0, pre: 0 }))
  }

  for (let i = 1; i <= la; i++)
    for (let j = 1; j <= lb; j++) {
        if( sa[i-1] == sb[j-1])
        {
          info[i][j] = { f: info[i-1][j-1].f + 1, pre: UL }
        }
        else if( info[i-1][j].f >= info[i][j-1].f)
        {
          info[i][j] = { f: info[i-1][j].f, pre: UP }
        }
        else {
          info[i][j] = { f: info[i][j-1].f, pre: LEFT }
        }
    }
}



function setup() {
  // const Sa_input = createInput(stra)
  // const Sb_input = createInput(strb)
  createCanvas(800, 600);
  textAlign(CENTER,CENTER)
  // textSize(16)
}

function drawMsg(msg,x,y) {
  textSize(Width / 4)
  // stroke(0)
  // fill(200, 255, 25)
  text(msg, x + Width / 2, y + Width / 2)
}

var cnt =0
function mouseClicked__() {
  let ta = select('#sa').value()
  let tb = select('#sb').value()

  if( ta.length == 0 || tb.length == 0) {
    alert('字符串不能为空')
    return
  }
  if( ' '.indexOf(ta) != -1 || ' '.indexOf(tb) != -1) {
    alert('字符串不能含有空格')
    return;
  }
  if( ta.length > max_length || tb.length > max_length) {
    alert('字符串的长度不能超过: ' + max_length)
    return
  }

  stra = ta
  strb = tb

  loop()
  
}



function draw() {
  background(220);
  calc_lcs(stra,strb)
  // rect(100, 100, 200, 200);

  const button = select('#calc');
  select("#sa").value(stra)
  select("#sb").value(strb)
  button.mousePressed(mouseClicked__)

  //先绘制 边上的字符
  for(let i = 0 ;i<= stra.length; ++i ) {
    let x = startX - 2*Width
    let y = startY + (i-1)*Width
    // stroke(0, 255, 0)
    let msg = `${i} : ${stra[i - 1]}`
    if (i == 0) msg = `${i}`
    drawMsg(msg,x,y)
  }

  for(let i = 0 ;i<= strb.length; ++i )
  {
    let x = startX +(i-1) *Width
    let y = startY - 2*Width
    let msg = `${i} : ${strb[i - 1]}`
    if (i == 0) msg = `${i}`
    drawMsg(msg,x,y)

  }

  for(let i = 0 ;i < info.length;++i) {
    for(let j = 0 ;j< info[i].length ; ++j)
      if( i == 0 || j == 0) {
        draw_cell(i,j, i || j || '0')
      }
      else {
        draw_cell(i,j)
      }
  }
  noLoop();
}
