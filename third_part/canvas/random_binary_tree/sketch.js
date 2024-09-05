var treeNodeSize = 10;
const log = console.log

function set_tree_raw_data(size,data) {
    let txt = size + '\n'
    txt += data.map(d => d.join(' ')).join('\n')
    $('#tree_data').text(txt)
}

var tree;
function __create_random_tree() {
    tree = new binary_tree(treeNodeSize); //生成了一个10个点的随机树
    // tree = new binary_tree(5); //生成了一个10个点的随机树
    // // tree._tree_size = 5
    // tree._raw_data = [
    //   [1,2,0],
    //   [2,3,1],
    //   [1,4,1],
    //   [4,5,0]
    // ]
    // tree.init_tree_nodes();
    set_tree_raw_data(treeNodeSize,tree.raw_data)

    //进行布局算法
    tree.jq_walker();
    background(220);
    let pg = draw_tree(tree.tree_nodes_array)
    image(pg,0,0,800,600,0,0,pg.width,pg.height,CONTAIN);
    // image(pg);
}

function setup() {
  createCanvas(800, 600,P2D,document.getElementById('mycanvas'));
  // createCanvas(800, 600);
  textAlign(CENTER,CENTER)
  background(220);
    __create_random_tree();
  // textSize(16)
}

$('document').ready( function () {
    let size = $('#myRange').val()
    $('#tree_node_size').text(size)
    treeNodeSize = size;
    // log(document.getElementById("myRange"),'123')
    $('#myRange').on('input', function()  {
        $('#tree_node_size').text(this.value)
        treeNodeSize = this.value;
    })
    // document.getElementById("myRange").addEventListener() .oninput( function () {
    // log('yes1')
    //     document.getElementById("tree_node_size").innerText = this.value
    // })
})
