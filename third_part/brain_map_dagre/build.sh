#!/bin/bash
NAME="brain_map_dagre"
npx vite build -c ./vite.config.js --base $NAME
rm -rf ../../dist/$NAME
mkdir -p ../../dist/$NAME
mv ./dist/* ../../dist/$NAME/
cp ./dagre-d3.js ../../dist/$NAME/
rm -rf ./dist
