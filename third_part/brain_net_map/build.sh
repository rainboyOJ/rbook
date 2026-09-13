#!/bin/bash
npx vite build -c ./vite.config.js --base brain_net_map
rm -rf ../../dist/brain_net_map
mkdir -p ../../dist
mv ./dist/ ../../dist/brain_net_map
