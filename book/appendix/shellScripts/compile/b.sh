#!/bin/env bash
# g++ 编译脚本 author: rainboy
# 2024-01-01

VERERSION="20240101"
CXX="g++"
FLAG=(-g)

# 有哪些参数
# -i,--input-file, 编译后,执行程序重定向的输入文件,可以为空,为空时,默认为 in
# -o,--output-file, 编译后,执行程序重定向的输出文件,可以为空
# -c,--choose-input,选择输入文件
# -I,不需要输入文件
# -d,使用 -DDEBUG 宏,默认添加
# -D,不使用 -DDEBUG 宏
# -s,-std,编译的标准,可以为空,为空时,检查cxx支持的最高c++标准
CHOOSE_INPUT=false
NO_INPUT_FILE=false
INPUT_FILE="in"
OUTPUT_FILE=""
SOURCE_FILE=""
# TARGET_FILE="${SOURCE_FILE%.cpp}.out"
TARGET_FILE=""
STD_OPTION="c++11"

OPTSTRING="-o i:o:IdDsc -l std:"

options=$(getopt -u $OPTSTRING -- "$@")
echo $options
set -- $options

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
      shift 2
      ;;
    -c)
      CHOOSE_INPUT=true
      shift 1
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
      SOURCE_FILE="$2"
      break
      ;;
    *)
      echo "Internal error!"
      exit 1
      ;;
  esac
done

## 函数 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

# 查找后缀相同的文件
function find_file {
    local find_str=$1
    local FZF_OPTIONS="--layout=reverse --height 40% --border --margin=0,1"
    val=$(find . -type f -name "$find_str" -printf "%f\n" | sort -f -i -t "." -k 1 | fzf $FZF_OPTIONS)
    echo "$val"
}

function check_file_exit {
    local file="$1"
    if [ ! -e "$file" ];then
        echo "$file not exit"
        exit 1
    fi
}

function get_cxx_version {
    local std="-std=c++11" 
    if [ -n "$(g++ -std=c++20 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="-std=c++20"
    elif [ -n "$(g++ -std=c++17 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="-std=c++17"
    elif [ -n "$(g++ -std=c++14 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="-std=c++14"
    elif [ -n "$(g++ -std=c++11 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="-std=c++11"
    else
        std=""
    fi
    echo "$std"
}
## 函数 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

### 没有源文件的情况
if [ -z "$SOURCE_FILE" ]; then
    SOURCE_FILE=$(find_file "*.cpp")
fi

## 检查cxx支持的最高std
check_file_exit "$SOURCE_FILE"
STD_OPTION=$(get_cxx_version)


## 默认的input文件 

if $CHOOSE_INPUT;then
    INPUT_FILE=$(find_file "*in*")
fi

if ! $NO_INPUT_FILE;then
    check_file_exit "$INPUT_FILE"
fi

### 调试,输出所有参数
echo "STD_OPTION" $STD_OPTION
echo "SOURCE_FILE" "$SOURCE_FILE"
echo "INPUT_FILE" "$INPUT_FILE"

## 编译阶段