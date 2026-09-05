// n 个结点
// p 概率,两个结点之间有边的概率
function generateRandomGraph(n, p) {
  const nodes = [];
  const edges = [];

  // 生成n个节点
  for (let i = 0; i < n; i++) {
    nodes.push({
      data: { id: 'node' + i }
    });
  }

  // 随机生成边：每一对节点都有概率p生成边
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < p) { // 生成边的概率为p
        edges.push({
          data: { source: 'node' + i, target: 'node' + j }
        });
      }
    }
  }

  return { nodes, edges };
}

const randomGraph = generateRandomGraph(10, 0.3); // 10个节点，每一对节点之间有30%的概率生成边

// 创建Cytoscape图
const cy = cytoscape({
  container: document.getElementById('cy'),
  elements: randomGraph.nodes.concat(randomGraph.edges),
  style: [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc'
      }
    }
  ],

  layout: {
    name: 'cose',
    animate: true
  }
});
