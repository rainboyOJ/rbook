#!/bin/bash

# ./node_modules/.bin/parcel build --no-cache --no-content-hash
yarn build

node ./bin/render_markdown.js

cp -r ./src/prism-theme ./dist/

make
./node_modules/.bin/sass ./src/markdown-style/markdown.scss ./dist/markdown.css

## 编译images文件下的asy
make install -C ./images/


## 复制所有的图片到dist目录
# 设置源目录和目标目录
source_dir="book"
target_dir="dist"

# 确保目标目录存在，如果不存在则创建
mkdir -p "$target_dir"

# 使用find命令查找源目录下的所有图片文件
find "$source_dir" -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.bmp" | while read -r img; do
    # 获取图片相对路径
    relative_path="${img#$source_dir/}"

    aim="$target_dir/$relative_path"
    # 确保目标子目录存在，如果不存在则创建
    mkdir -p "$(dirname "$aim")"

    # 复制图片到目标目录
    if [ ! -e "$aim" ] || [ "$img" -nt "$aim" ];then
        echo "copy to $aim"
        cp "$img" "$aim"
    fi
done

echo "book 目录所有图片复制完成!"