#!/bin/bash

for i in {1..100}; do
	printf "\r$i"
	./data >in # 数据生成
	./acw_135.out <in >out1
	./right.out <in >out2
	diff out1 out2 || exit 1
done
