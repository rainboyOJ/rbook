#!/bin/bash

./node_modules/bin/parcel build --no-cache --no-content-hash

node ./bin/render_markdown.js

cp -r ./src/prism-theme ./dist/

./node_modules/.bin/sass ./src/markdown-style/markdown.scss ./dist/markdown.css
