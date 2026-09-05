// n 个结点
// import _ from '/libraries/lodash.js'

function tippyFactory(ref, content){
  // Since tippy constructor requires DOM element/elements, create a placeholder
  var dummyDomEle = document.createElement('div');

  console.log(ref,content)
  var tip = tippy( dummyDomEle, {
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: 'manual', // mandatory
    // dom element inside the tippy:
    content: content,
    // your own preferences:
    arrow: true,
    placement: 'bottom',
    hideOnClick: false,
    sticky: "reference",

    // if interactive:
    interactive: true,
    appendTo: document.body // or append dummyDomEle to document.body
  } );

  return tip;
}

// p 概率,两个结点之间有边的概率
function generateRandomGraph(n, p) {
  const nodes = [];
  const edges = [];

  // 生成n个节点
  for (let i = 1; i <= n; i++) {
    nodes.push({
      data: { id:  i }
    });
  }

  // 随机生成边：每一对节点都有概率p生成边
  for (let i = 1; i <= n; i++) {
    for (let j = i + 1; j <= n; j++) {
      if (Math.random() < p) { // 生成边的概率为p
        edges.push({
          data: { source:  i, target:  j }
        });
      }
    }
  }
  return { nodes, edges };
}

function random_range(l,r) {
  return Math.floor(Math.random() * (r - l + 1)) + l
}

// 根据点的数量和边的数量生成图
function generateGraphByNodeAndEdgeCount(numNodes, numEdges) {  
  const nodes = [];  
  const edges = [];  

  // 生成节点  
  for (let i = 1; i <= numNodes; i++) {  
    nodes.push({  
      data: { id: i }  
    });  
  }  

  let maxEdgeCount = numNodes * (numNodes - 1) / 2;  
  if (numEdges > maxEdgeCount) {  
    let error = `Cannot generate a graph with ${numNodes} nodes and ${numEdges} edges.`
    alert(error)
    throw new Error(error)
  }
  //生成一个树
  let edgeCount = numNodes-1;  
  for(let i =2;i<=numNodes;i++) {
    edges.push({
      data: { source: i, target: random_range(1,i-1) }
    });  
  }

  // 生成边  
  console.log('numEdges',numEdges)
  while (edgeCount < numEdges) {  
    // 随机选择两个节点  
    const source = random_range(1, numNodes)
    const target = random_range(1, numNodes)

    // 确保source和target不同  
    if (source !== target) {  
      // 检查是否已经存在该边  
      const existingEdge = edges.find(edge => (  
        (edge.data.source === source && edge.data.target === target) ||  
        (edge.data.source === target && edge.data.target === source)  
      ));  

      // 如果不存在该边,则添加新的边  
      if (!existingEdge) {  
        edges.push({  
          data: { source: source, target: target }  
        });  
        edgeCount++;  
        console.log('edgeCount',edgeCount)
      }  
    }  
  }  

  // console.log(nodes)
  // console.log(edges)

  return { nodes, edges };  
}

var makeContent = function(text){
  console.log(text)
  var div = document.createElement('div');
  div.classList.add('popper')
  div.innerHTML = text;
  return div;
};

const randomGraph = generateRandomGraph(10, 0.3); // 10个节点，每一对节点之间有30%的概率生成边

cytoscape.use(cytoscapePopper(tippyFactory));
// 创建Cytoscape图
const cy = cytoscape({
  container: document.getElementById('cy'),
  // elements: randomGraph.nodes.concat(randomGraph.edges),
  elements: [],
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': 'black', // 结点标签颜色设为黑色  
        'background-color': 'white', // 结点背景色设为白色  
        'border-color': 'black', // 结点边框颜色设为黑色  
        'border-width': 3, // 结点边框宽度设为 2  
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#ccc'
        // 'line-color':'#210115'
      }
    },
    {
      selector: 'edge.highlight',
      style: {
        'width': 3,
        'line-color': 'green'
        // 'line-color':'#210115'
      }
    },
    {
      selector: 'node.highlight',
      style: {
        'color':'white',
        'background-color': 'blue', // 结点背景色设为白色  
      }
    }
  ],

  layout: {
    name: 'breadthfirst',
    animate: true
  }
});


function generateGraph(graph) {
  let randomGraph 
  console.log(graph)
  // if( graph.useProbability) {
  if(false) {
    randomGraph = generateRandomGraph(graph.nodes, graph.probability);
  } else {
    let numEdges = random_range(graph.nodes-1, graph.nodes * (graph.nodes - 1) / 2)
    randomGraph = generateGraphByNodeAndEdgeCount(graph.nodes, numEdges);
  }
  cy.elements().remove();
  cy.add(randomGraph.nodes.concat(randomGraph.edges));
  cy.layout({
    name: graph.layout ||  'breadthfirst',
    animate: true
  }).run();
  return randomGraph 
}

function change_layout(layout) {
  cy.layout({
    name: layout ||  'breadthfirst',
    animate: true
  }).run();
}

//根据dfsp graph 来生成 ,访问图的序列
// start 为起点
function dfs(graph,start) {
  let visited_seq = []
  let visited = [] //访问过的点
  let dfn = 0;
  let low_arr = Array.from({length:graph.nodes.length+10},() => 0)
  let dfn_arr = Array.from({length:graph.nodes.length+10},() => 0)
  //记录每个点的父亲
  let node_father = Array.from({length:graph.nodes.length+10},() => 0)
  let cut = Array.from({length:graph.nodes.length+10},() => 0)
  let root = start; //根结点

  //真正的dfs
  function __dfs(graph,father) {
    dfn++;
    let child = 0; //孩子的数量
    dfn_arr[father] = low_arr[father] = dfn;
    visited_seq.push({ type:'node',id:father})
    visited.push(father)

    // 访问点 father 周围的边
    graph.edges.forEach(edge => {
      let next = -1; // 下一个点
      if(  edge.data.source == father ) {
        next = edge.data.target;
      }
      else if (edge.data.target == father )
      {
        next = edge.data.source
      }
      next = parseInt(next)
      if( next == -1) return; //没有找到
      if( visited.indexOf(next) == -1) { //没有访问过
        node_father[next] = father
        // console.log(father,next,low_arr[father],low_arr[next])
        child++;
        visited_seq.push({ type:'edge',...edge.data})
        __dfs(graph, next)
        // debugger;
        low_arr[father] = Math.min(low_arr[father], low_arr[next])

        // 得到了孩子的low值
        if( low_arr[next] >= dfn_arr[father]) {
          cut[father] = 1;
        }
        // console.log('after',father,next,low_arr[father],low_arr[next])
      }
      else if( next != node_father[father]) { //非父子边
        low_arr[father] = Math.min(low_arr[father], dfn_arr[next])
      }
    })
    //退出这个点
    if( father == root && child > 1) {
      cut[father] = 1;
    }
  }
  __dfs(graph,start);
  console.log(low_arr)
  console.log(dfn_arr)
  // 设置每个点的low值
  visited_seq.forEach(d => {
    if( d.type == 'node') {
       d.low = low_arr[d.id] 
       d.dfn = dfn_arr[d.id]
       d.cut = cut[d.id]
    }
  })

  return visited_seq
}

const app = Vue.createApp({
    data() {
      return {
        node_count: 10,
        edge_count: 20,
        probability: 0.3,
        // layout: 'breadthfirst',
        layout: 'dagre',
        useProbability: true,
        randomGraph:{ nodes: [], edges: []},
        visited_seq:[],
      }
    },
    created() {
      // this.randomGraph = generateGraph(this.graph);
      this.generateGraphButton()
    },
    methods: {
      generateGraphButton: function() {
        document.querySelectorAll('div[data-tippy-root]').forEach(d => d.remove())
        this.randomGraph = generateGraph(this.graph);
      },
      dfs_next() {
        // cy.nodes("#1").addClass("highlight")
        let visited_seq = dfs(this.randomGraph,1)
        console.log(visited_seq)
        this.visited_seq = visited_seq
        this.set_dfs_process_index(visited_seq.length)
      },
      set_dfs_process_index(idx) {
        if( idx <= this.visited_seq.length) {
          //删除所有元素的.highlight
          cy.elements('.highlight').removeClass('highlight')
          // document.querySelectorAll('.popper').forEach( d => d.remove())
          document.querySelectorAll('div[data-tippy-root]').forEach(d => d.remove())

          for(let i = 0; i < idx; i++) {
            let seq = this.visited_seq[i]
            // console.log(seq)
            if( seq.type == 'node') {
              cy.nodes("#"+seq.id).addClass("highlight")
              cy.getElementById(''+seq.id).popper({
                content: makeContent(`low:${seq.low} dfn:${seq.dfn}`),
              }).show()
            } 
            else 
            {
              cy.edges('#'+seq.id).addClass("highlight")
              console.log('edges.id',seq)
            }
              // cy.edges(`[source=${seq.source}][target=${seq.target}]`).addClass("highlight")
          }
          
        }
      }
    },
    computed: {
      //图的属性
      graph_text_data() {
        let n = this.randomGraph.nodes.length
        let m = this.randomGraph.edges.length
        let txt = n+' ' + m + '\n' + this.randomGraph.edges.map(d => d.data.source + ' ' + d.data.target).join('\n')
        return txt
      },
      node_cnt(){ return this.randomGraph.nodes.length },
      edge_cnt(){ return this.randomGraph.edges.length },
      graph() {
        return {
          nodes: this.node_count,
          edges: this.edge_count,
          probability: this.probability,
          useProbability: this.useProbability,
          layout: this.layout
        }
      }
    },
    watch: {
      layout: _.debounce( (newVal, oldVal)=>{
        change_layout(newVal);
      },500),
      // graph: _.debounce( (newVal, oldVal)=>{
      //   console.log(newVal);
      //   generateGraph(newVal);
      // },500),
    }
})

app.mount('#app')