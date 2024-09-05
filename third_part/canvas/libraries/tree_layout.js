function random_int(l,r) {
    return Math.floor(Math.random() * (r - l + 1)) + l;
}
class node_with_layout_info {
    constructor(idx) {
        this.x = 0;
        this.y = 0;
        this.dep = 0;
        this.prelim = 0;
        this.mod = 0;
        this.fa
        this._idx = idx;
        this.fa = 0;
        this.left_neighbor = 0;
        this.child = [];
    }
    get pos() {
        return [this.x,this.y];
    }

    get idx() {
        return this._idx;
    }

    get is_leaf() {
        return this.child.length == 0 || this.child.reduce( (a,s)=> a+s,0) == 0;
    }

    // 判断当前节点是否有左邻居
    get has_left_neighbor() {
        return this.left_neighbor != 0;
    }
}



class binary_tree_node  extends node_with_layout_info {
    constructor(idx) {
        super(idx);
        this.child = [0,0];
    }

    // 判断当前节点是否为根节点
    get isRoot() {
        return this.fa == 0;
    }

    get lson() {
        return this.child[0];
    }

    get rson() {
        return this.child[1];
    }


    // 判断当前节点是否有左子节点
    get has_lson() {
        return this.child[0] != 0;
    }

    // 判断当前节点是否有右子节点
    get has_rson() {
        return this.child[1] != 0;
    }

    get has_lrson(){
        return this.has_lson && this.has_rson;
    }

    get is_leaf() {
        return !this.has_lson && !this.has_rson;
    }
}

class normal_tree {

    constructor(tree_size) {
        this._tree_size = tree_size
        this.nodes = []
        this.pre_node_at_dep = Array.from({length: tree_size+1}, () => 0) // 初始化为0,表示没有

        this.Root = 1;

        this.xTopAdjustment = 1; // 整个树偏离x的值
        this.yTopAdjustment = -1;// 整个树偏离y的值
        this.levelSeparation = 2;
        this.SlibingSeparation = 2; //兄弟结点之间的间隔
        this.SubtreeSeparation = 2; //子树之间的间隔

        this._raw_data = this.random_tree(); // 生成随机树数据
        this.init_tree_nodes(); //根据 _raw_data 生成树初始化树的结点
    }

    get size() {
        return this._tree_size
    }
    get raw_data() {
        return this._raw_data
    }

    get tree_nodes_array() {
        return this.nodes
    }

    // 生成树初始化树的结点
    init_tree_nodes() {
        this.nodes = []
        for(let i = 0;i<=this.size;i++) {
            this.nodes.push(new node_with_layout_info(i));
        }
        for(let [fa,ch] of this.raw_data) {
            this.nodes[fa].child.push(ch);
            this.nodes[ch].fa = fa;
        }
    }

    random_tree() {
        let data = []
        for(let i =2;i<=this.size ;i++) {
            let fa =  random_int(1,i-1);
            data.push([fa,i])
        } 
        return data;
    }


    //dfs 遍历整个树,得到一些树上的信息,
    // 主要是每个节点的位置的dep和左邻居
    init_dfs_tree_info(u,dep) {
        // console.log(u,dep)
        this.nodes[u].dep = dep

        //左邻居
        this.nodes[u].left_neighbor = this.pre_node_at_dep[dep];
        this.pre_node_at_dep[dep] = u;

        for(let ch of this.nodes[u].child) {
            if( ch == 0) continue
            this.init_dfs_tree_info(ch,dep+1);
            
        }
    }

    // 得到每个点的prelim,与mod
    // 核心思想: 
    // 1. 每个点都向左靠拢
    // 2. 根据子树的根与孩子的中间值,来调整孩子,使得单独的子树是美的 
    // 3. 使得当前子树与左边的相邻子树不重叠 apportion(u)
    first_walk(u) {
        debugger;
        // console.log(u)
        if( this.nodes[u].is_leaf) { //是叶子结点
            this.nodes[u].mod = 0;
            // this.nodes[u].prelim = 0;
            // 和左边的相邻结点加上间隔
            if( this.nodes[u].has_left_neighbor) {
                let v = this.nodes[u].left_neighbor;
                this.nodes[u].prelim = this.nodes[v].prelim + this.SlibingSeparation;
            }
            return
        }

        //非叶子结点
        for(let i = 0 ;i < this.nodes[u].child.length ;i++ )
        {
            let v = this.nodes[u].child[i]
            if( v == 0) continue;
            this.first_walk(v);
        }

        let mid = this.calc_mid_with_child(u);

        //先向左靠拢
        if( this.nodes[u].has_left_neighbor) {
            let neighbor = this.nodes[u].left_neighbor
            this.nodes[u].prelim = this.nodes[neighbor].prelim + this.SlibingSeparation;
        }
        else { //没有左邻居,使当前结点的prelim 变成孩子的中间位置
            this.nodes[u].prelim  = mid;
        }

        //调整子树的位置,使得子树变成父亲的中间
        this.nodes[u].mod = this.nodes[u].prelim - mid;
        this.apportion(u);
    }

    //通过孩子计算mid的值
    calc_mid_with_child(u) {
        let first_child_prelim = 0;
        let last_child_prelim = 0;
        let first = true;
        for(let ch of this.nodes[u].child) {
            if( ch == 0) continue
            if(first) {
                first = false;
                last_child_prelim = first_child_prelim = this.nodes[ch].prelim;
            }
            else {
                last_child_prelim = this.nodes[ch].prelim;
            }
        }
        return (first_child_prelim + last_child_prelim)/2
    }

    //得到从结点u开始向下走dep层后最左边的结点
    // 0 表示没有
    get_left_most_node(u,dep) {
        if( dep == 0) return u;
        for( let i = 0 ;i< this.nodes[u].child.length ;i++)
        {
            let v = this.nodes[u].child[i];
            if( v == 0) continue;
            let ans = this.get_left_most_node(v,dep-1);
            if( ans != 0 ) return ans;
        }
        return 0;
    }

    // 从当前结点u向上走at_dep个结点后能达到祖先,ancestor
    // 求出从ancestor 开始到达这个结点 调整加起的值 再加u.prelim 得到的真的值
    real_pos_by_ancestor(u,dep) {
        let modSum = 0;
        let t = u;
        if( dep == 0) return this.nodes[u].prelim;
        
        //求出祖先的mod的和
        do {
            dep--;
            t = this.nodes[t].fa;
            modSum += this.nodes[t].mod;
        }while( dep != 0);

        //被祖先调整的值
        return this.nodes[u].prelim + modSum;
    }

    // 3. 使得当前以u为根的子树与左边的相邻子树不重叠 apportion(u)
    // 方法: 一层一层的调整
    apportion(u) {
        let compare_dep = 1;
        while(1) {
            let left_most = this.get_left_most_node(u,compare_dep);
            if( left_most == 0) break;
            let neightbor = this.nodes[left_most].left_neighbor;
            if( neightbor == 0) break;

            let left_most_pos = this.real_pos_by_ancestor(left_most,compare_dep);
            let right_most_pos = this.real_pos_by_ancestor(neightbor,compare_dep);

            let move_dis = 0;

            // 两者之间的差 不符合要求
            if( left_most_pos - right_most_pos < this.SlibingSeparation ) {
                move_dis = right_most_pos +  this.SubtreeSeparation - left_most_pos;
            }
            // 为什么u的prelim 也要移动呢?
            // 因为mod只要影响子树的位置,自己(u)也要移动
            this.nodes[u].prelim += move_dis;
            this.nodes[u].mod += move_dis;

            compare_dep++;
        }
    }

    // 很简单: 计算每个位置真实的值(x,y)
    second_walk(u,modSum) {
        this.nodes[u].y = this.nodes[u].dep * this.levelSeparation + this.yTopAdjustment;

        // console.log(u,this.nodes[u].prelim,modSum,this.xTopAdjustment)
        this.nodes[u].x = this.nodes[u].prelim + modSum + this.xTopAdjustment;
        // console.log(u,this.nodes[u])

        for( let i = 0 ;i< this.nodes[u].child.length ;i++){
            let v = this.nodes[u].child[i];
            if (v == 0) continue;
            this.second_walk(v,modSum + this.nodes[u].mod);
        }
    }

    /**
     * @desc 使用jq_walker算法 生成二进制树的布局
     */
    jq_walker() {
        //深度从1开始
        this.init_dfs_tree_info(this.Root,1);
        this.first_walk(this.Root);
        this.second_walk(this.Root,0);
    }

}

class binary_tree extends normal_tree {
    constructor(tree_size) {
        super(tree_size)
    }

    //生成随机二树数的数据
    random_tree() { 
        let data = []
        let _map = Array.from({length:this.size+1} , () => [0,0])
        for(let i = 2;i<=this.size;i++) {
            while(1) {
                let ch = random_int(0,1); //生成左孩子还是右孩子
                let fa = random_int(1,i-1);
                // console.log('random_tree', i, _map,ch,fa);
                if( _map[fa][ch] == 0 ) {
                    _map[fa][ch] = i;
                    data.push([fa,i,ch])
                    break;
                }
            }
        }
        return data
    }

    init_tree_nodes() {
        this.nodes = []
        for(let i = 0 ;i<=this.size;i++){
            let node = new binary_tree_node(i)
            this.nodes.push(node);
        }

        for(let [fa,ch,son] of this.raw_data) {
            this.nodes[fa].child[son] = ch;
            this.nodes[ch].fa = fa;
        }
    }

    //通过孩子计算mid的值
    calc_mid_with_child(u) {
        let mid = 0;
        if( this.nodes[u].has_lrson) { //同时有左右孩子
            let l  = this.nodes[u].lson
            let r  = this.nodes[u].rson
            mid = (this.nodes[l].prelim + this.nodes[r].prelim)/2
        }
        else if( this.nodes[u].has_lson) {
            let l  = this.nodes[u].lson
            mid = this.nodes[l].prelim + this.SlibingSeparation / 2;
        }
        else if( this.nodes[u].has_rson){ //只有右孩子
            let r  = this.nodes[u].rson
            mid = this.nodes[r].prelim - this.SlibingSeparation / 2;
        }
        return mid;
    }

}



// console.log(new binary_tree(4).raw_data)
// let t = new binary_tree(5);
// console.log(t.raw_data)
// t.jq_walker();


//绘制一个树
//tree_nodes_array:由 nodes_with_layout_info数组 绘制
function draw_tree(tree_nodes_array) {

    let r = 50;
    let rate = 50;
    let left_mod = 0 //左便宜

    console.log(tree_nodes_array)
    function get_pos(u) {
        let [x,y] = tree_nodes_array[u].pos
        // console.log(u,x,y)
        return [x*rate + left_mod,y*rate]
    }

    //得到最大深度的值,与右结点位置
    let max_X,max_Y
    let min_X
    for(let i = 1 ;i < tree_nodes_array.length;i++) {
        let [x,y] = get_pos(i)
        if( !max_X || max_X  < x) max_X = x
        if( !min_X || min_X  > x) min_X = x
        if( !max_Y || max_Y  < y) max_Y = y
    }
    max_X += r;
    max_Y += r;

    // 有时候会有一个些值为负值,这个时候需要整体向右便宜一下
    if(min_X < 2*r) {
        left_mod = 2*r - min_X;
        max_X += left_mod
    }
    // console.log('max')
    // console.log(max_X,max_Y)

    let pg = createGraphics(max_X,max_Y);
    pg.textAlign(CENTER,CENTER);

    function draw_node(u) {
        let [x,y] = get_pos(u);
        pg.circle(x,y,r);
        pg.text(u+'',x,y);
        //绘制文字
    }

    function draw_line(u,fa) {
        if( fa != 0) {
            let [x1,y1] = get_pos(fa);
            let [x2,y2] = get_pos(u);
            pg.line(x1,y1,x2,y2);
        }

        if(tree_nodes_array[u].child) {
            for(let ch of tree_nodes_array[u].child) {
                if( ch == 0) continue;
                draw_line(ch,u)
            }
        }
    }
    //draw Root
    draw_line(1,0);

    for(let i = 1 ;i < tree_nodes_array.length;i++) {
        draw_node(i);
    }
    // console.log(pg)
    return pg
}