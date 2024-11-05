#!/bin/bash

for i in {1..100}; do
	printf "\r$i"
	./rnd.out >in # 数据生成
	./baoli.out <in >out1
	./sgt_find_first_lt.out <in >out2
	diff out1 out2 || exit 1
done
