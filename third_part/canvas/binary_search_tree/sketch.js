let treeNodeSize = 10;
const log = console.log;
let bst;

function set_tree_raw_data(size, data) {
  let txt = size + '\n';
  txt += data.map((d) => d.join(' ')).join('\n');
  $('#tree_data').text(txt);
}

function __create_random_tree() {
  const size = parseInt(treeNodeSize);
  bst = new binary_search_tree(size);
  set_tree_raw_data(size, bst.raw_data);
  bst.jq_walker();
  background(240);
  const pg = draw_tree(bst.tree_nodes_array);
  image(pg, 0, 0, 800, 600, 0, 0, pg.width, pg.height, CONTAIN);
}

function setup() {
  createCanvas(800, 600, P2D, document.getElementById('mycanvas'));
  textAlign(CENTER, CENTER);
  background(240);
  __create_random_tree();
}

document.addEventListener('DOMContentLoaded', function () {
  const range = document.getElementById('myRange');
  range.addEventListener('input', function () {
    document.getElementById('tree_node_size').innerText = this.value;
    treeNodeSize = this.value;
  });

  const copyButton = document.getElementById('copy_button');
  copyButton.addEventListener('click', () => {
    const treeData = document.getElementById('tree_data').innerText;
    navigator.clipboard.writeText(treeData).then(() => {
      copyButton.innerText = 'Copied!';
      setTimeout(() => {
        copyButton.innerText = 'Copy';
      }, 2000);
    });
  });
});
