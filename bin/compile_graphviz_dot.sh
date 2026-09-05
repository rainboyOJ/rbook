#!/bin/bash
#
# 出错就直接退出
set -e

function compile_dot() {
	file=$1
	outname=${file%.*}.svg
	echo $file $outname
	dot -Tsvg -o $outname $file
}

for dotfile in $(ls *.{dot,gv}); do
	compile_dot $dotfile
done
