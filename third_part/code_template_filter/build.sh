#!/bin/bash
npx vite build -c ./vite.config.js --base code_template
rm -rf ../../dist/code_template
mkdir -p ../../dist
mv ./dist ../../dist/code_template
