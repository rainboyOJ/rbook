#!/bin/bash

# 定义一个数组
my_array=("apple" "banana" "cherry")

# 保存原始的IFS值
original_IFS=$IFS

# 设置IFS为一个空格
IFS=","

# 使用*将数组元素连接成一个空格分隔的字符串
result="${my_array[*]}"

# 恢复IFS为原始值
IFS=$original_IFS

# 打印结果
echo $result
