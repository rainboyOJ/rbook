import { DataSet, Network } from "vis-network/standalone";
// import mynodes from "./nodes.js";
// CSS will be automatically injected into the page.

function htmlTitle(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}
// create an array with nodes
const new_nodes_with_html_title = Nodes.map( node => {
    return {
        ...node,
        title:htmlTitle(node.title || node.label || node.id)
    }
})
const nodes = new DataSet(new_nodes_with_html_title);

// create an array with edges
const edges = new DataSet(Edges);
const data = {
  nodes: nodes,
  edges: edges
};

// create a network
const container = document.getElementById("mynetwork");

const options = {
    autoResize: true,
    height: '100%',
    width: '100%',
    locale: 'en',
    clickToUse: false,
    interaction:{
        tooltipDelay: 300
    },
    nodes :{
        shape: 'box',
        shadow:{
            enabled: true,
            color: 'rgba(0,0,0,0.5)',
            size:10,
            x:5,
            y:5
        },
    },
    edges : {
        arrows : {
            to : {
                enabled:true,
                type:'arrow'
            }
        },
        // dashes:true,
        hoverWidth: 1.5,
        shadow:{
            enabled: false,
            color: 'rgba(0,0,0,0.5)',
            size:10,
            x:5,
            y:5
        },
    },
    layout: {
        randomSeed: 100,
        improvedLayout: false,
        clusterThreshold: 150,
        hierarchical: {
            enabled: false,
            levelSeparation: 150,
            nodeSpacing: 200,
            treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction: 'UD',        // UD, DU, LR, RL
            sortMethod: 'hubsize',  // hubsize, directed
            shakeTowards: 'leaves'  // roots, leaves
        }
    },
    interaction :{
        hover:true
    }
};
const network = new Network(container, data, options);

network.on('click', function(params) {
  if (params.nodes.length > 0) {
    var clickedNodeId = params.nodes[0];
    var clickedNode = nodes.get(clickedNodeId);
    console.log(clickedNode)
    let href = clickedNode.href || clickedNode.md_file.href
    if( href ) {
        const result = confirm("要想到跳转到对应的页面吗?");
        if( result){
            console.log(href)
            window.open(href, '_blank');
        }

    }
    
    // 检查是否点击的是带有链接的结点
  }
});

