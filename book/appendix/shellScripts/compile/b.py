#!/usr/bin/env python3
# filepath: /Users/rainboy/.config/nvim/dotfiles/scripts/b

"""
快速编译脚本
g++ 编译脚本 author: rainboy
upd: 2024-08-25
  - 增加了 --help
  - 修改了 -d 参数为添加-DDEBUG编译宏
2024-01-01
"""

import argparse
import os
import sys
import subprocess
import glob
import platform
import shutil

VERSION = "20240825"
# 根据操作系统选择编译器
if platform.system() == "Darwin":  # macOS
    CXX = "clang++"
else:
    CXX = "g++"
CXXFLAG = ["-g"]

RED = "\033[31m"
GREEN = "\033[32m"
ENDCOLOR = "\033[0m"

def find_files(pattern):
    """查找匹配模式的文件"""
    return glob.glob(pattern, recursive=True)


def select_file(files, header="选择文件"):
    """优先使用 fzf 选择文件；未安装时使用终端编号选择。"""
    files = sorted(files)
    if not files:
        print(f"{header}: 没有找到匹配文件")
        return None

    if shutil.which("fzf"):
        result = subprocess.run(
            ["fzf", "--height=40%", "--reverse", "--border", f"--prompt={header}> "],
            input="\n".join(files) + "\n",
            text=True,
            capture_output=True,
        )
        if result.returncode == 0:
            return result.stdout.strip() or None
        return None

    print(header)
    for index, file_path in enumerate(files, start=1):
        print(f"  {index}. {file_path}")

    while True:
        try:
            choice = input("请输入编号（直接回车取消）: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return None

        if not choice:
            return None
        if choice.isdigit() and 1 <= int(choice) <= len(files):
            return files[int(choice) - 1]
        print(f"请输入 1 到 {len(files)} 之间的编号。")


def check_file_exists(file_path):
    """检查文件是否存在"""
    return os.path.exists(file_path)

def get_cxx_version():
    """检查C++支持的最高标准"""
    # standards = ["20", "17", "14", "11"]
    standards = ["17", "14", "11"]
    for std in standards:
        try:
            # clang++ 需要不同的参数来检查标准支持
            if CXX == "clang++":
                result = subprocess.run(
                    [CXX, f"-std=c++{std}", "-E", "-x", "c++", "-"],
                    input="",
                    text=True,
                    capture_output=True,
                    timeout=10
                )
            else:  # g++
                result = subprocess.run(
                    [CXX, f"-std=c++{std}", "-dM", "-E", "-x", "c++", "-"],
                    input="",
                    text=True,
                    capture_output=True,
                    timeout=10
                )
            if result.returncode == 0:
                return std
        except subprocess.TimeoutExpired:
            continue
    return "11"  # 默认返回C++11

def compile_source(source_file, target_file, std_option, args):
# def compile_source(source_fi,std_option,args):
    """编译源文件"""
    compile_args = [CXX] + CXXFLAG

    if std_option:
        compile_args.append(f"-std=c++{std_option}")

    if args.freopen:
        compile_args.append("-DFREOPEN")

    if args.debug:
        compile_args.append("-DDEBUG")
    else:
        compile_args.append("-DONLINE_JUDGE -O0")

    compile_args.extend(["-o", target_file, source_file])

    print(" ".join(compile_args))

    try:
        result = subprocess.run(compile_args, check=True)
        if result.returncode == 0:
            print(f"编译成功 {target_file}")
            return True
        else:
            print("编译失败!")
            return False
    except subprocess.CalledProcessError:
        print("编译失败!")
        return False

def run_program(target_file, input_file, output_file):
    """运行程序"""
    run_args = [f"./{target_file}"]

    try:
        # 处理输入文件
        stdin_handle = None
        if input_file and os.path.exists(input_file):
            stdin_handle = open(input_file, 'r')
        
        # 处理输出文件
        stdout_handle = None
        if output_file:
            stdout_handle = open(output_file, 'w')
        
        try:
            if input_file and os.path.exists(input_file):
                print(f"执行代码: [ ./{target_file} < {input_file} ]")
                subprocess.run([f"./{target_file}"], stdin=stdin_handle, stdout=stdout_handle)
            else:
                print(f"执行代码: [ ./{target_file} ]")
                subprocess.run([f"./{target_file}"], stdout=stdout_handle)
        finally:
            # 确保文件句柄被正确关闭
            if stdin_handle:
                stdin_handle.close()
            if stdout_handle:
                stdout_handle.close()
                
    except Exception as e:
        print(f"运行程序时出错: {e}")

def main():
    parser = argparse.ArgumentParser(description="g++ 编译脚本")
    parser.add_argument("source_file", nargs="?", help="源文件")
    parser.add_argument("-i", "--input-file", help="输入文件,默认为in")
    parser.add_argument("-o", "--output-file", help="输出文件")
    parser.add_argument("-c", "--choose-input", action="store_true", help="选择输入文件")
    parser.add_argument("-I", "--no-input", action="store_true", help="不需要输入文件")
    parser.add_argument("-d", "--debug", action="store_true", help="添加编译宏 -DDEBUG")
    parser.add_argument("-s", "--std", help="编译标准,如11,14,17,20")
    parser.add_argument("-f", "--freopen", action="store_true",help="使用freopen重定向输入到in")
    parser.add_argument("-n", "--norun", action="store_true", help="编译后不要运行")
    parser.add_argument("-v", "--version", action="version", version=f"version: {VERSION}")

    args = parser.parse_args()

    # 处理源文件
    source_file = args.source_file
    print(f"source_file: {source_file}")

    if not source_file:
        cpp_files = find_files("*.cpp")
        source_file = select_file(cpp_files, header="选择源文件")
        if not source_file:
            print("未选择源文件")
            return 1

    # 源文件以 `.` 结尾
    if source_file and source_file.endswith("."):
        source_file = source_file[:-1] # 移除末尾的点

    # 确保源文件以.cpp结尾
    if not source_file.endswith(".cpp"):
        source_file = f"{source_file}.cpp"

    if not check_file_exists(source_file):
        print(f">>> 源码: [ {source_file } ] 不存在!")
        return 1

    # 确定目标文件
    target_file = f"{source_file[:-4]}_debug.out" if args.debug else f"{source_file[:-4]}.out"

    # 处理输入文件
    input_file = None
    if not args.freopen:
        input_file = args.input_file or "in"
        if args.choose_input:
            input_files = find_files("*in*")
            input_file = select_file(input_files, header="选择输入文件")
        elif not args.no_input and not check_file_exists(input_file):
            input_files = find_files("*in*")
            input_file = select_file(input_files, header="选择输入文件")

    # 检查C++标准
    std_option = args.std or get_cxx_version()

    # 编译
    if not os.path.exists(target_file) or os.path.getmtime(source_file) > os.path.getmtime(target_file):
        if not compile_source(source_file,target_file,std_option,args):
            return 1
    else:
        print(f">>> 源码 {source_file} 没有 {target_file} 新,不编译")

    # 运行
    if args.norun:
        return 0

    # 如果没有输入文件,询问是否运行
    if not args.no_input and input_file and not check_file_exists(input_file):
        do_run = input("输入文件为[空] 或 [不存在],是否执行代码[Y/n]? ").strip().lower()
        if do_run in ['n', 'no']:
            return 0

    run_program(target_file, input_file, args.output_file)

    return 0

if __name__ == "__main__":
    sys.exit(main())
