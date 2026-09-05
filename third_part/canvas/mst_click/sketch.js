let nodes = [];
let edges = [];
const width = 600;
const height = 400;

function setup() {
  createCanvas(width, height);
  createGraph();
  applyD3ForceLayout();
}

  function edge_show(edge) {
    stroke(0);
    strokeWeight(1);
    // line(this.nodeA.x, this.nodeA.y, this.nodeB.x, this.nodeB.y);
    let This = edge
    let x1 = nodes[This.source].x
    let y1 = nodes[This.source].y
    let x2 = nodes[This.target].x
    let y2 = nodes[This.target].y
    if (edge.select)
    {
      strokeWeight(5);
      stroke(156, 255, 105);
    }
    line(x1,y1,x2,y2)
    strokeWeight(1);
  }

function draw() {
  background(220);
  // 画边
  for (let edge of edges) {
    // edge.show();
    edge_show(edge)
  }
  // 画节点
  for (let node of nodes) {
    node.show();
  }
}

class Node {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.selected = false;
  }

  show() {
    fill(255);
    if(this.selected)
    {
      fill(0, 255, 0);
      stroke(255);
    }
    else {
      fill(255);
      stroke(0);
    }
    ellipse(this.x, this.y, 30, 30);

    if(this.selected)
      fill(255,0,0);
    else
      fill(0);
    textAlign(CENTER, CENTER);
    text(this.id, this.x, this.y);
  }
}

function createGraph() {
  // 创建一些节点
  for (let i = 0; i < 5; i++) {
    nodes.push(new Node(random(width), random(height), i));
  }
  // 创建一些边
  addEdge(nodes[0], nodes[1]);
  addEdge(nodes[1], nodes[2]);
  addEdge(nodes[2], nodes[3]);
  addEdge(nodes[3], nodes[4]);
  addEdge(nodes[4], nodes[0]);
  addEdge(nodes[0], nodes[2]);
}

function addEdge(nodeA, nodeB) {
  edges.push({source :nodeA.id, target:nodeB.id,select:false});
}

function applyD3ForceLayout() {
  let edges_copy = edges.map( edge => Object.create(edge) )
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(edges_copy).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .stop()

  let tick_cnt = 50
  for (let i = 0; i < tick_cnt ;i++)
    simulation.tick()
}


function mousePressed() {
  for (let node of nodes) {
    if (dist(mouseX, mouseY, node.x, node.y) < 10) {
      node.selected = !node.selected
      return;
    }
  }

  for (let link of edges ) {
    if (isPointOnLine(mouseX, mouseY, link.source, link.target)) {
      link.select = !link.select;
      console.log(link)
      return;
    }
  }
}

// 检测点是否在连接的直线上
function isPointOnLine(px, py, source, target) {

  let x1 = nodes[source].x
  let y1 = nodes[source].y
  let x2 = nodes[target].x
  let y2 = nodes[target].y

  const d1 = dist(px, py, x1, y1);
  const d2 = dist(px, py, x2, y2);
  const lineLen = dist(x1,y1,x2,y2);
  const buffer = 10; // 允许的误差

  return d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer;
}