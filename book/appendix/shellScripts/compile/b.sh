#!/bin/env bash
# g++ 编译脚本 author: rainboy
# 2024-01-01

VERERSION="20240101"
CXX="g++"
FLAG=(-g)

# 有哪些参数
# -i,--input-file, 编译后,执行程序重定向的输入文件,可以为空,为空时,默认为 in
# -o,--output-file, 编译后,执行程序重定向的输出文件,可以为空
# -I,不需要输入文件
# -d,使用 -DDEBUG 宏,默认添加
# -D,不使用 -DDEBUG 宏
# -s,-std,编译的标准,可以为空,为空时,检查cxx支持的最高c++标准
NO_INPUT_FILE=false
SOURCE_FILE="1.cpp"
TARGET_FILE="${SOURCE_FILE%.cpp}.out"
STD_OPTION="c++11"

OPTSTRING="-o i:o:IdDs -l std:"

options=$(getopt $OPTSTRING -- "$@")
echo $options

# 检查是否 getopt 解析失败
if [ $? -ne 0 ];then
    echo "Usage: $(basename $0) [-s|--source SOURCE_FILE] [-t|--target TARGET_FILE] [--std STANDARD_VERSION]" >&2
    exit 1
fi

# # 处理参数
while [ -n "$1" ]; do
  case "$1" in
    -i)
      SOURCE_FILE="$2"
      echo $SOURCE_FILE
      shift 2
      ;;
    -o)
      TARGET_FILE="$2"
      echo $TARGET_FILE
      shift 2
      ;;
    --std)
      STD_OPTION="$2"
      echo $STD_OPTION
      shift 2
      ;;
    --)
      shift
      break
      ;;
    *)
      echo "Internal error!"
      exit 1
      ;;
  esac
done

## 编译阶段