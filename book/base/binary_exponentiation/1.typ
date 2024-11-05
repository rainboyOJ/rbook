#set page(height: auto, width: auto)
#import "@preview/cetz:0.3.0"

#cetz.canvas({
  import cetz.draw: *
  // 绘制一行rect 
  let gap = 1
  let width = 5
  let n = 10; //总长是多少
  let start = 2; // 起始位置
  let end = 8;
  for i in array.range(1,n+1){
    let x1 = i * width + (i - 1) * gap
    let y1 = 0
    let x2 = x1 + width
    let y2 = y1 + width
    rect((x1,y1),(x2,y2),radius: 25%)
  }

})
