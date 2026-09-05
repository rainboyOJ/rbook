class BSTNode {
  constructor(val) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

class binary_search_tree extends normal_tree {
  constructor(tree_size) {
    super(tree_size);
  }

  // override random_tree to generate BST-specific structure
  random_tree() {
    const values = Array.from({ length: this.size }, (_, i) => i + 1);
    // shuffle values
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    this._raw_data = [];
    this._bstRoot = null;

    function insert(node, val) {
      if (!node) {
        return new BSTNode(val);
      }
      if (val < node.val) node.left = insert(node.left, val);
      else node.right = insert(node.right, val);
      return node;
    }

    // build BST
    for (const v of values) {
      this._bstRoot = insert(this._bstRoot, v);
    }

    // traverse tree to generate raw_data edges
    function traverse(node) {
      if (!node) return;
      if (node.left) {
        this._raw_data.push([node.val, node.left.val, 0]);
        traverse.call(this, node.left);
      }
      if (node.right) {
        this._raw_data.push([node.val, node.right.val, 1]);
        traverse.call(this, node.right);
      }
    }

    traverse.call(this, this._bstRoot);
    return this._raw_data;
  }
}
