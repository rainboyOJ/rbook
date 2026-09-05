import graph;

// 定义树节点样式
void drawNode(pair xy, string s) {
    label(s, xy, 5W);
    draw(circle(xy, 0.5));
}

// 设置树节点和路径样式
defaultpen(linewidth(0.7) + fontsize(10));
arrowbar arrowhead = Arrow(HookHead, size = 4);
path p;
 
// 绘制树的节点和边
void drawTree() {
    pair root = (0,0);
    pair leftChild = (-1,-1);
    pair rightChild = (1,-1);
    pair leftGrandChild = (-1.5,-2);
    pair rightGrandChild = (0.5,-2);
    
    drawNode(root, "1");
    drawNode(leftChild, "1");
    drawNode(rightChild, "1");
    drawNode(leftGrandChild, "1");
    drawNode(rightGrandChild, "1");
    
    p = root--leftChild;
    draw(p, arrowhead);
    
    p = root--rightChild;
    draw(p, arrowhead);
    
    p = rightChild--leftGrandChild;
    draw(p, arrowhead);
    
    p = rightChild--rightGrandChild;
    draw(p, arrowhead);
}

// 调用绘图函数
drawTree();
