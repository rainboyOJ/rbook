#!/bin/bash
## 生成动画

make -C manimce

bash ./manimce/copy.sh

echo "manim 动画 生成完毕!"
