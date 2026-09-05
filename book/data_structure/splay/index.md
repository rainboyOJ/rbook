---
title: Splay
status: TODO
---
## 核心1: 旋转

- zig,右旋
- zag,左旋

第一步:你要理解zig为什么是右,zag为什么是左 https://english.stackexchange.com/a/145052



zig,与zag是一对相反的操作

我们的目的把一个点u旋转到根,那就需要根据点u和父亲的关系(左还是右孩子),来决定是zig还是zag

- 实现`rotate(u)`,旋转u,提升u的dep

## 伸展操作

把点u通过旋转操作提升到top点的孩子

## 参考

- [Splay Tree Datastructure](http://www.btechsmartclass.com/data_structures/splay-trees.html)
