#!/bin/bash
# check.sh —— 对拍脚本
# ./wrong_greedy 是被测程序, ./brute 是标准答案(01 序列暴力)

g++ -o gen gen.cpp || exit 1
g++ -o wrong_greedy wrong_greedy.cpp || exit 1
g++ -o brute brute.cpp || exit 1

for i in {1..100}; do
	printf "\r$i"

	./gen >in                       # 生成数据
	./brute <in >out_std            # 标准答案
	./wrong_greedy <in >out_g       # 被测程序

	diff -b out_g out_std || exit 1
done
