# 切换到 b.sh 所在目录
NAME="brain_map_dagre"
npx vite build -c ./vite.config.js --base $NAME
/usr/bin/rm -rf ../../dist/$NAME
mv ./dist/ ../../dist/$NAME
cp ./dagre-d3.js ../../dist/$NAME
