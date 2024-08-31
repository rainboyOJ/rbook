const log = console.log
function getRandomInt(l, r) {  
  return Math.floor(Math.random() * (r - l + 1)) + l;  
} 

var treeNodeSize; //树的大小
var treeRoot = 1;
var treeEdge = []; // 描述n个结点之间的连线,有treeNodeSize -1 条边

//每个节点的信息
// fa 父亲
// left_sib 左兄弟
// child:[] 孩子
// { fa,left_sib ,child:[] }
var Tree = []

// 按层存每个结点的编号
var TreeLevelNode = []

// --- 全局变量,树布局相关


//生成n个结点的随机树
function init_random_tree(n) {
    treeNodeSize = n;

    //生成空结点
    Tree = [];
    TreeLevelNode = []
    for(let i = 0;i<=n;i++) {
        Tree.push({prelim:0,mod:0})
        TreeLevelNode.push([]);
    }

    treeEdge = []
    for(let i = 2;i<=n;i++) {
        let fa = getRandomInt(1,i-1);
        treeEdge.push( [fa,i]);
        Tree[i].fa = fa
        if( !Tree[fa].child) {
            Tree[fa].child = []
        }
        Tree[fa].child.push(i)
    }
    log(treeEdge)
    init_dfs_tree(treeRoot,0);
    log(Tree)
}


//---  treeLayout 相关算法

//得到结点编号为u的最左最右位置
function get_left_right_most_pos(u,modSum = 0) {
    
    let l= Tree[u].prelim + modSum, r = Tree[u].prelim + modSum;
    if( Tree[u].child )
    {
        for(let i = 0 ;i < Tree[u].child.length;i++) {

            let v = Tree[u].child[i]
            let [t1,t2] = get_left_right_most_pos(v,modSum + Tree[u].mod)
            if( l > t1 ) l = t1;
            if( r < t2 ) r = t2;
        }
    }
    return [l,r]
}

// 从当前结点u向上走at_dep个结点后能达到祖先,ancestor
// 求出从ancestor 开始到达这个结点 调整加起的值 再加u.prelim 得到的真的值
function real_pos_by_ancestor(u,at_dep) {
    let modSum = 0;
    let t = u;
    do  {
        at_dep--;
        t = Tree[t].fa;
        modSum += Tree[t].mod;
    }while(at_dep != 0)
    return modSum + Tree[u].prelim;
}

// 得到at_dep 的最左边的结点的编号
function get_left_mos_node(u,at_dep) {
    if( at_dep == 0) return u;

    if( Tree[u].child) {
        for(let ch of Tree[u].child) {
            let v = get_left_mos_node(ch,at_dep-1);
            if( v != undefined)
                return v;
        }
    }
    return undefined

}


//--初始化的树上的每个结点的一些信息
function init_dfs_tree(u,dep) {
    Tree[u].dep = dep
    if(TreeLevelNode[dep].length) {
        Tree[u].left_sib = TreeLevelNode[dep][ TreeLevelNode[dep].length-1 ]
    }
    TreeLevelNode[dep].push(u)
    
    if( Tree[u].child) {
        for(let i = 0 ;i < Tree[u].child.length;i++)
        {
            let v = Tree[u].child[i];
            init_dfs_tree(v,dep+1);
        }
    }
}

// -- 一些jq walker 算法需要的全局变量

const xTopAdjustment = 1; // 整个树偏离x的值
const yTopAdjustment = 1;// 整个树偏离y的值

const levelSeparation = 2;
const SlibingSeparation = 2; //兄弟结点之间的间隔
const SubtreeSeparation = 2; //子树之间的间隔

// 先序便利每一个结点
function first_walk(u){

    if( !Tree[u].child ) { //是叶子结点
        Tree[u].prelim = Tree[u].left_sib ? Tree[Tree[u].left_sib].prelim  + SlibingSeparation : 0;
    }
    else {

        //遍历每个孩子结点
        for(let i = 0 ;i < Tree[u].child.length ;i++) {
            let v = Tree[u].child[i];
            first_walk(v);
        }
        let first_child = Tree[u].child[0], last_child = Tree[u].child[ Tree[u].child.length - 1];
        let mid = (Tree[first_child].prelim + Tree[last_child].prelim) / 2;
        Tree[u].prelim = Tree[u].left_sib ? Tree[Tree[u].left_sib].prelim  + SlibingSeparation : mid;
        Tree[u].mod = Tree[u].prelim - mid; // 调整子树便宜的位置

        //  计算 所有的孩子的
        let [left_most,_] = get_left_right_most_pos(u);
        let right_most = 0;
        for( let sib of TreeLevelNode[Tree[u].dep]) {
            if( sib  == u) break;
            let [t1,t2] = get_left_right_most_pos(sib)
            if( right_most < t2)
                right_most = t2;
        }

        // 这里不好, 还是应该一层一层的现下拓展.
        // let Movedis = 0;
        // if( left_most - right_most < SubtreeSeparation ) {
        //     Movedis = right_most + SubtreeSeparation - left_most;
        // }
        // Tree[u].prelim += Movedis;
        // Tree[u].mod += Movedis;

        apportion(u);
    }

}

//从u开始一层一层的调整与左边子树之间的关系
function apportion(u) {

    let compare_dep = 1;
    while(1) {
        let left_most = get_left_mos_node(u,compare_dep)
        if( left_most == undefined) break;
        let neighbor = Tree[left_most].left_sib
        if( neighbor == undefined ) break;

        let left_most_pos = real_pos_by_ancestor(left_most,compare_dep);
        let right_most_pos = real_pos_by_ancestor(neighbor,compare_dep);

        let Movedis = 0;
        if( left_most_pos - right_most_pos < SubtreeSeparation ) {
            Movedis = right_most_pos + SubtreeSeparation - left_most_pos;
        }
        Tree[u].prelim += Movedis;
        Tree[u].mod += Movedis;

        compare_dep++;
    }
}

function second_walk(u,modSum) {
    Tree[u].y = Tree[u].dep * levelSeparation + yTopAdjustment;
    Tree[u].x = Tree[u].prelim + modSum + xTopAdjustment;

    if( Tree[u].child)
    {
        for(let ch of Tree[u].child ) {
            second_walk(ch,modSum + Tree[u].mod)
        }
    }
}


function jq_walker() {
    log('treeNodeSize',treeNodeSize)
    init_random_tree(treeNodeSize);
    first_walk(treeRoot);
    second_walk(treeRoot,0);
    log(Tree)
}


// 根据Tree数据进行绘制Tree
function draw_tree() {
    background(220);
    let r = 50;
    let rate = 50;
    let left_mod = 0

    function get_pos(u) {
        let {x,y} = Tree[u]
        return [x*rate + left_mod,y*rate]
    }


    //得到最大深度的值,与右结点位置
    let max_X,max_Y
    let min_X
    for(let i = 1 ;i < Tree.length;i++) {
        let [x,y] = get_pos(i)
        if( !max_X || max_X  < x)
            max_X = x
        if( !min_X || min_X  > x)
            min_X = x
        if( !max_Y || max_Y  < y)
            max_Y = y
    }
    max_X += r;
    max_Y += r;

    // 有时候会有一个些值为负值,这个时候需要整体向右便宜一下
    if(min_X < 0) {
        left_mod = - min_X +r;
        max_X += left_mod
    }

    let pg = createGraphics(max_X,max_Y)
    pg.textAlign(CENTER,CENTER)

    function draw_node(u) {
        let [x,y] = get_pos(u);
        pg.circle(x,y,r);
        pg.text(u+'',x,y);
        //绘制文字
    }


    function draw_line(u,fa) {
        if( fa != -1) {
            let [x1,y1] = get_pos(fa);
            let [x2,y2] = get_pos(u);
            pg.line(x1,y1,x2,y2);
        }

        if(Tree[u].child) {
            for(let ch of Tree[u].child) {
                draw_line(ch,u)
            }
        }
    }
    draw_line(treeRoot,-1);
    for(let i = 1 ;i < Tree.length;i++) {
        draw_node(i)
    }
    image(pg,0,0,width,height,0,0,pg.width,pg.height,CONTAIN)
}




function setup() {
  // const Sa_input = createInput(stra)
  // const Sb_input = createInput(strb)
  createCanvas(800, 600);
  textAlign(CENTER,CENTER)
    background(220);
  // textSize(16)
}


function __create_random_tree() {
    jq_walker();
    draw_tree();
}



// -------------- ui

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
