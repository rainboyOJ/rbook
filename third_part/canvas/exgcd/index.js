// 参数
const WIDTH = 80
const HEIGHT = 40
const PADDING = 40

var a = 12
var b = 8

var exgcd_info = []


//返回值[gcd,x,y]
// gcd 最在公约数
// x,y 一组解
function exgcd(a,b,dep) {
    //清空
    if( dep == 1 ) {
        exgcd_info = [{a:'a',b:'b',x:'x',y:'y'}]
    }
    if(b == 0)  {
        exgcd_info.push({a,b,x:1,y:0})
        return [a,1,0];
    }
    exgcd_info.push({a,b,x:0,y:0})
    let [gcd,x,y] = exgcd(b, a % b ,dep+1);
    let x0 = y
    let y0 = x-Math.floor(a*y/b)
    exgcd_info[dep].x = x0
    exgcd_info[dep].y = y0
    return [gcd,x0,y0]
}

// let ans = exgcd(a,b,1);
// console.log(ans)
// console.log(exgcd_info)

function get_number(id) {
  return $('#s'+id).val()
}

function set_number(id,v) {
  $('#s'+id).val(v)
}


//画一个行info
function draw_one_info({a,b,x,y},draw_rect = true) {
  //calc one_line size
  let info = [a,b,x,y]
  let rect_cnt = 4;
  let height = HEIGHT + PADDING
  let width = WIDTH * rect_cnt + PADDING * 2
  let pg = createGraphics(width,height)
  pg.textSize(20)
  pg.textAlign(CENTER,CENTER)

  //draw rect
  for (let i = 0; i < rect_cnt; i++) {
    let x = PADDING + WIDTH * i
    let y = PADDING
    if( draw_rect)
      pg.rect(x, y, WIDTH, HEIGHT)
    pg.text(info[i]+'', x + WIDTH/2, y + HEIGHT/2)
  }
  return pg
}

function draw_exgcd() {
  console.log('a=',a,b)
  exgcd(a, b, 1);
  console.log(exgcd_info)
  const left_padding = 100
  for (let i = 0; i < exgcd_info.length; i++) {
    let pg = draw_one_info(exgcd_info[i], i > 0)
    image(pg, left_padding, pg.height * (i))
  }
  // draw_arrow

  //计算第row行的col列 rect的up 点或down点的坐标
  function cacl_rect_point(row,col, up = true)
  {
    let y = (PADDING + HEIGHT) * (row + 1);
    if( up )
      y -= HEIGHT

    let x = left_padding + PADDING + WIDTH * col + WIDTH/2;
    return [x,y]
  }

  for (let i = 1;i < exgcd_info.length-1; i++) {
    line(...cacl_rect_point(i,2,false),...cacl_rect_point(i+1,3,true))
    line(...cacl_rect_point(i,3,false),...cacl_rect_point(i+1,2,true))
  }
}

function setup() {
  createCanvas(800, 600)
  // createCanvas(800, 600);
  textAlign(CENTER,CENTER)
  background(220);
  // textSize(16)
  draw_exgcd();
}

$('document').ready( function () {
  set_number('a',a)
  set_number('b',b)
  $('#calc').click(function () {
    a = get_number('a')
    b = get_number('b')
    background(220)
    draw_exgcd()
  })
})
