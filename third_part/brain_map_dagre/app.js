
/*

// nodes 数据
{
    id: 'neovim',
    title: 'neovim',
    file: 'index.md',
    hiden_in_brain: true,
    copy: [ './vimrc.txt' ],
    md_file: {
      file_path: '/home/rainboy/mycode/rbookr/newRbook_ejs/book/appendix/SoftWare/neovim/index.md',
      file_dir: '/home/rainboy/mycode/rbookr/newRbook_ejs/book/appendix/SoftWare/neovim',
      relative_path: 'book/appendix/SoftWare/neovim/index.md',
      href: '/appendix/SoftWare/neovim/index.html',
      output_path: '/home/rainboy/mycode/rbookr/newRbook_ejs/dist/appendix/SoftWare/neovim/index.html',
      output_dir: '/home/rainboy/mycode/rbookr/newRbook_ejs/dist/appendix/SoftWare/neovim',
      git_location: 'https://github.com/rainboyOJ/rbook/tree/master/book/appendix/SoftWare/neovim/index.md'
    },
    meta: { revision: 0, created: 1730810169944, version: 0 },
    '$loki': 82,
    label: 'neovim'
  }
]

// Edges 数据
[
  { from: 'number_base', to: 'binary_exponentiation' },

*/

// Create the input graph
var g = new dagreD3.graphlib.Graph()
  .setGraph({})
  .setDefaultEdgeLabel(function() { return {}; });

// 调试用
// console.log(Nodes)
// console.log(Edges)


//设置点
for(let node of Nodes) {
    g.setNode(node.id,{label:node.label || node.title})
}

g.nodes().forEach(function(v) {
  var node = g.node(v);
  // Round the corners of the nodes
  node.rx = node.ry = 5;
});

//设置边
for(let edge of Edges) {
    g.setEdge(edge.from,edge.to)
}

// 创建渲染器
var render = new dagreD3.render();

// Set up an SVG group so that we can translate the final graph.
var svg = d3.select("svg"),
    svgGroup = svg.append("g");

// Run the renderer. This is what draws the final graph.
render(d3.select("svg g"), g);

// Center the graph
// var xCenterOffset = (svg.attr("width") - g.graph().width) / 2;
// svgGroup.attr("transform", "translate(" + xCenterOffset + ", 20)");
svg.attr("height", g.graph().height + 40);
svg.attr("width", g.graph().width+ 40);