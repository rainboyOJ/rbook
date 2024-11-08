#!/bin/env bash
# g++ 编译脚本 author: rainboy
# upd: 2024-08-25
#   - 增加了 --help
#   - 修改了 -d 参数为添加-DDEBUG编译宏
# 2024-01-01

VERSION="20240825"
CXX="g++"
CXXFLAG=("-g")

# 有哪些参数
# -i,--input-file, 编译后,执行程序重定向的输入文件,可以为空,为空时,默认为 in
# -o,--output-file, 编译后,执行程序重定向的输出文件,可以为空
# -c,--choose-input,选择输入文件
# -I,不需要输入文件
# -d,不使用 -DDEBUG 宏,默认添加
# -s,-std,编译的标准,可以为空,为空时,检查cxx支持的最高c++标准
# -n,--norun 编译后不要运行
CHOOSE_INPUT=false
NO_INPUT_FILE=false
INPUT_FILE="in"
OUTPUT_FILE=""
SOURCE_FILE=""
TARGET_FILE=""
# TARGET_FILE="${SOURCE_FILE%.cpp}.out"
STD_OPTION=""
DEBUG_FLAG=false
NO_RUN=false

RED="\e[31m"
GREEN="\e[32m"
ENDCOLOR="\e[0m"

OPTSTRING="-o i:o:Idscnvh -l std:,version,help"

options=$(getopt -u $OPTSTRING -- "$@")
# 检查是否 getopt 解析失败
if [ $? -ne 0 ]; then
	echo "Usage: $(basename $0) 执行失败" >&2
	exit 1
fi

# echo $options
set -- $options

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
	-I) #不需要输入文件
		NO_INPUT_FILE=true
		shift 1
		;;
	-o)
		OUTPUT_FILE="$2"
		shift 2
		;;
	-d)
		DEBUG_FLAG=true
		shift 1
		;;
	-n)
		NO_RUN=true
		shift 1
		;;
	--std)
		STD_OPTION="$2"
		# echo $STD_OPTION
		shift 2
		;;
	-v | --version)
		echo "version: $VERSION"
		exit 0
		;;
	-h | --help)
		echo "--help 输出帮助信息"
		echo "-v | --version 输出版本"
		echo "-d  添加编译宏 -DDEBUG"
		echo "-I  直接运行，不要重定向输入"
		echo "-o in 重定向输入到in"
		echo "-o out 重定向输出到out"
		echo "-n  norun,编译后不运行"
		echo "-c  choose,选择输入文件"
		exit 0
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

# 查找名字含有相同字符串的文件
#
function find_file {
	local find_str
	find_str=$1
	shift 1
	local FZF_OPTIONS="--no-sort --layout=reverse --height 40% --border --margin=0,1"
	local files
	# files="$(find . -type f -name "$find_str" -printf "%f\n")"
	files="$(find . -type f -name "$find_str")"
	if [ -z "$files" ]; then
		echo ""
	else
		echo "$files" | sort -f -i -t '.' -k 1 | fzf $* $FZF_OPTIONS
	fi
}

function check_file_exit {
	local file="$1"
	if [ ! -e "$file" ]; then
		return 0 # 表示文件不存在
	fi
	return 1 # 表示文件存在
}

function get_cxx_version {
	local std="11"
	if g++ -std=c++20 -dM -E -x c++ - </dev/null | grep -q -oP '__cplusplus\s+\K[0-9]+'; then
		std="20"
	elif g++ -std=c++17 -dM -E -x c++ - </dev/null | grep -q -oP '__cplusplus\s+\K[0-9]+'; then
		std="17"
	elif g++ -std=c++14 -dM -E -x c++ - </dev/null | grep -q -oP '__cplusplus\s+\K[0-9]+'; then
		std="14"
	elif g++ -std=c++11 -dM -E -x c++ - </dev/null | grep -q -oP '__cplusplus\s+\K[0-9]+'; then
		std="11"
	else
		std=""
	fi
	echo "$std"
}
## 函数 <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

### 没有源文件的情况
if [ -z "$SOURCE_FILE" ]; then
	SOURCE_FILE=$(find_file "*.cpp" "-1") # -1 自动选择一个元素,如果只有一个
fi

### 检查SOURCE_FILE的后缀是否为cpp

if [[ "$SOURCE_FILE" == *"." ]]; then
	SOURCE_FILE="${SOURCE_FILE%.*}.cpp"
fi

if [[ "$SOURCE_FILE" != *".cpp" ]]; then
	SOURCE_FILE="$SOURCE_FILE.cpp"
fi

if check_file_exit "$SOURCE_FILE"; then
	printf ">>> 源码: [ %s ] 不存在!\n" "$SOURCE_FILE"
	exit 1
fi

TARGET_FILE="${SOURCE_FILE%.cpp}.out"

if $DEBUG_FLAG; then
	TARGET_FILE="${SOURCE_FILE%.cpp}_debug.out"
fi

## 默认的input文件

if $CHOOSE_INPUT; then
	INPUT_FILE=$(find_file "*in*")
fi

# 需要输入文件
if ! $NO_INPUT_FILE; then
	# 输入文件不存在,选取文件
	if [ ! -e "$INPUT_FILE" ]; then
		INPUT_FILE=$(find_file "*in*")
	fi
fi

## 检查cxx支持的最高std
if [ -n $"$STD_OPTION" ]; then
	STD_OPTION=$(get_cxx_version)
fi

### 调试,输出所有参数
if false; then
	echo "STD_OPTION" $STD_OPTION
	echo "SOURCE_FILE" "$SOURCE_FILE"
	echo "INPUT_FILE" "$INPUT_FILE"
fi

## 编译阶段

### TARGET_FILE 不存在,或没有SOURCE_FILE 新
if [ ! -e $TARGET_FILE ] || [ $SOURCE_FILE -nt $TARGET_FILE ]; then
	compile_args_arr=("${CXXFLAG[@]}")

	if [ -n "$STD_OPTION" ]; then
		compile_args_arr+=("-std=c++$STD_OPTION")
	fi

	if $DEBUG_FLAG; then
		compile_args_arr+=("-DDEBUG")
	fi

	compile_args_arr+=("-o $TARGET_FILE")
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

	if [ $? -ne 0 ]; then
		echo "编译失败!"
		exit 1
	else
		echo "编译成功 " $TARGET_FILE
	fi
else
	echo ">>> 源码 $SOURCE_FILE 没有 $TARGET_FILE 新,不编译"
fi

## 编译后
if $NO_RUN; then
	exit 0
fi

run_args_arr=("./$TARGET_FILE")

if ! $NO_INPUT_FILE; then
	if [ -n "$INPUT_FILE" ] && [ -e "$INPUT_FILE" ]; then # 输入文件不为空
		run_args_arr+=("< $INPUT_FILE")
	else
		while true; do
			read -r -p "输入文件为[空] 或 [不存在],是否执行代码[Y/n]?" do_run
			if [ "$do_run" = "Y" ] || [ "$do_run" = "y" ]; then
				break
			elif [ "$do_run" = "N" ] || [ "$do_run" = "n" ]; then
				exit 0
			fi
		done
	fi
fi

if [ -n "$OUTPUT_FILE" ]; then
	run_args_arr+=("> $OUTPUT_FILE")
fi

original_IFS=$IFS
IFS=" "
run_args_str="${run_args_arr[*]}"
IFS=$original_IFS

printf "执行代码: [ %s ]\n" "$run_args_str"

if [ -n "$OUTPUT_FILE" ]; then
	./"$TARGET_FILE" <"$INPUT_FILE" >"$OUTPUT_FILE"
else
	./"$TARGET_FILE" <"$INPUT_FILE"
fi
