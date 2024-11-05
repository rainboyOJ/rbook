let nodes = [];
let jump_idx= []; //那些会跳转的节点的索引, 从1开始
const width = 800;
const height = 400;

const MAX = 20;
var n = 10;
var start = 2;
var end = 8;

const rw = 50;
const gap = 30;

var slider_n,slider_start,slider_end



function setup() {
  createCanvas(width, height);
  slider_n = createSlider(1, MAX, 10); // 创建滑块，范围从0到100，初始值为50
  slider_n.position(20, 20);

  slider_start = createSlider(1, MAX,2); // 创建滑块，范围从0到100，初始值为50
  slider_start.position(slider_n.position().x + slider_n.width + 20, 20);

  slider_end = createSlider(1, MAX, 8); // 创建滑块，范围从0到100，初始值为50
  slider_end.position(slider_start.position().x + slider_start.width + 20, 20);

}

function draw() {
  background(255);
  n = slider_n.value();
  start = slider_start.value();
  end = slider_end.value();
  textSize(16);
  // textAlign(CENTER, CENTER);
  fill(0);
  text(`n=${n}`, slider_n.position().x + slider_n.width / 2, 15);
  text(`start=${start}`, slider_start.position().x + slider_start.width / 2, 15)
  text(`end=${end}`, slider_end.position().x + slider_end.width / 2, 15)
  if( start > end || start < 1 || end > n || n < 2 ) {
    textSize(16);
    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    text("Invalid input!", width / 2, height / 2);
  }
  else {
    let pg_height = 5*rw;
    init_nodes(pg_height);
    binary_jump(start, end);
    // console.log(jump_idx)
    let pg = createGraphics(nodes[nodes.length-1].x+rw,pg_height);
    draw_rects(pg);
    image(pg, 0, 0, width, height,0,0,pg.width,pg.height,CONTAIN);
  }

}

// 二进制跳跃算法,倍增思想
// 从x开始jump 到y
function binary_jump(x,y) {
  jump_idx = [];
  let k = Math.floor( Math.log2(y-x) );
  while( k >=0) {
    if( x + (1<<k) <= y) {
      let node = {}
      x+=(1<<k);
      node.id = x;
      node.k = k; //跳转的长度
      jump_idx.push(node);
    }
    k--;
  }
}

function init_nodes(height) {
  nodes = [];
  let green = color(0, 255, 0);
  let red = color(255, 0, 0);
  for(let i = 1; i <= n; i++){
    let x = (i-1)*(rw+gap); //坐标
    let y = 0 + height/2 - rw/2;
    // let y = rw/2;
    let node = {id: i, x: x, y: y, fill: false}
    if( i == start || i == end)
      node.fill = green;
    else if( i > end )
      node.fill = red;
    nodes.push(node);
  }
}

function draw_rects(pg) {
  for(let i = 0; i< nodes.length; i++)
  {
    // 是否跳转
    let jump = false;
    let id = nodes[i].id;
    let jump_color = color(255, 0, 255);
    let jump_k = 0;
    for(let j = 0; j< jump_idx.length; j++)
    {
      if( jump_idx[j].id == id ){
        jump = true;
        jump_k = jump_idx[j].k;
        break;
      }
    }

    if( jump ) {
      pg.fill(jump_color);
      //添加文字
      pg.text(`jump k=${jump_k}`, nodes[i].x + rw / 2, nodes[i].y - rw / 2);
    }

    if( nodes[i].fill )
      pg.fill(nodes[i].fill)
    else
      pg.fill(255);
    pg.rect(nodes[i].x,nodes[i].y,rw,rw);
    //add text id
    pg.textSize(16);
    pg.textAlign(CENTER, CENTER);
    pg.fill(0);
    // middle of the rect
    pg.text(nodes[i].id,nodes[i].x+rw/2,nodes[i].y+rw/2);
  }
}

