#!/bin/env bash
# g++ 编译脚本 author: rainboy
# 2024-01-01

VERERSION="20240101"
CXX="g++"
CXXFLAG=("-g")

# 有哪些参数
# -i,--input-file, 编译后,执行程序重定向的输入文件,可以为空,为空时,默认为 in
# -o,--output-file, 编译后,执行程序重定向的输出文件,可以为空
# -c,--choose-input,选择输入文件
# -I,不需要输入文件
# -d,不使用 -DDEBUG 宏,默认添加
# -s,-std,编译的标准,可以为空,为空时,检查cxx支持的最高c++标准
CHOOSE_INPUT=false
NO_INPUT_FILE=false
INPUT_FILE="in"
OUTPUT_FILE=""
SOURCE_FILE=""
TARGET_FILE=""
# TARGET_FILE="${SOURCE_FILE%.cpp}.out"
STD_OPTION="11"
DEBUG_FLAG=true

OPTSTRING="-o i:o:Idsc -l std:"

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
      OUTPUT_FILE="$2"
      shift 2
      ;;
    -d)
      DEBUG_FLAG=false
      shift 1
      ;;
    --std)
      STD_OPTION="$2"
      # echo $STD_OPTION
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
    local std="11" 
    if [ -n "$(g++ -std=c++20 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="20"
    elif [ -n "$(g++ -std=c++17 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="17"
    elif [ -n "$(g++ -std=c++14 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="14"
    elif [ -n "$(g++ -std=c++11 -dM -E -x c++ - < /dev/null | grep -oP '__cplusplus\s+\K[0-9]+')" ]; then
        std="11"
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
check_file_exit "$SOURCE_FILE"
TARGET_FILE="${SOURCE_FILE%.cpp}.out"

## 检查cxx支持的最高std
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

### TARGET_FILE 不存在,或没有SOURCE_FILE 新
if [ ! -e $TARGET_FILE ] || [ $SOURCE_FILE -nt $TARGET_FILE ];then
    compile_args_arr=("${CXXFLAG[@]}")
    if [ -n "$STD_OPTION" ];then
        compile_args_arr+=("-std=c++$STD_OPTION")
    fi

    if $DEBUG_FLAG;then
      compile_args_arr+=("-DDEBUG")
    fi

    compile_args_arr+=("-o \"$TARGET_FILE\"")
    compile_args_arr+=("$SOURCE_FILE")
    original_IFS=$IFS

    # 设置IFS为一个空格
    IFS=" "

    # 使用*将数组元素连接成一个空格分隔的字符串
    compile_args_str="${compile_args_arr[*]}"
    # 恢复IFS为原始值
    IFS=$original_IFS
    echo $CXX "$compile_args_str"
    $CXX $compile_args_str

    if [ $? -ne 0 ];then
        echo "编译失败!"
        exit 1
    else
        echo "编译成功 " $TARGET_FILE
    fi
fi