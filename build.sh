#!/bin/bash

# step1. 读取所有的信息,把信息写入rbookdb的数据库
# step2. 从rbookdb里,读取信息,然后进行渲染

# ./node_modules/.bin/parcel build --no-cache --no-content-hash
yarn build

# node ./bin/render_markdown.js
npx rbook db update
npx rbook renderAll

# 编译所有的scss文件,似乎没有什么用,因为下面的一行代码就编译了
# 如果发现问题,就把这个反注释
# make

npx sass ./src/markdown-style/markdown.scss ./dist/markdown.css

## 编译images文件下的asy
make install -C ./images/

## 复制所有的图片到dist目录
# 设置源目录和目标目录
source_dir="book"
target_dir="dist"

bash ./bin/copy_images.sh

echo "compile third part"

# >> 编译 third_part 下的所有代码
printf ">>>>>>>>>>>>>>>>>>>>>>> 编译 third_part 下的所有代码\n"
bash ./third_part/build.sh >/dev/null
printf "<<<<<<<<<<<<<<<<<<<<<<< 编译 third_part 下的所有代码 [OK]\n"

# pwd

# cp -r ./src/prism-theme ./dist/
rsync -avP --delete ./src/prism-theme/ ./dist/prism-theme/
# 函数 rsync dir 下面的所有文件夹
function rsync_dir {
    for dir in $(find $1 -mindepth 1 -maxdepth 1 -type d); do
        # echo "$dir"
        rsync -av "$dir" ./dist/
    done
}

# 复制论文
rsync_dir "./assets/"

bash ./copy_all_manim_mp4.sh
