// n 个结点
// import _ from '/libraries/lodash.js'

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

  // 生成边  
  let edgeCount = 0;  
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

const randomGraph = generateRandomGraph(10, 0.3); // 10个节点，每一对节点之间有30%的概率生成边

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
        'width': 3,
        'line-color': '#ccc'
        // 'line-color':'#210115'
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
  if( graph.useProbability) {
    randomGraph = generateRandomGraph(graph.nodes, graph.probability);
  } else {
    randomGraph = generateGraphByNodeAndEdgeCount(graph.nodes, graph.edges);
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

const app = Vue.createApp({
    data() {
      return {
        node_count: 10,
        edge_count: 20,
        probability: 0.3,
        layout: 'breadthfirst',
        useProbability: true,
        randomGraph:{ nodes: [], edges: []},
      }
    },
    created() {
      // this.randomGraph = generateGraph(this.graph);
      this.generateGraphButton()
    },
    methods: {
      generateGraphButton: function() {
        this.randomGraph = generateGraph(this.graph);
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