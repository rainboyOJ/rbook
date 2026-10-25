#!/bin/bash
# 把文章目录里声明的 Typst 源文件编译成同目录 PDF，供正文用 <iframe> 内嵌。
#
# 只编译「被声明的」源文件：文章 config.yaml 里写上
#
#   typst: 比赛赛前注意事项.typ
#
# 才会参与编译。book/ 下散落的草稿 .typ 不会被误编译。
# 产物与源文件同名同目录（.typ -> .pdf），再由该 config 的 copy 字段复制进 dist。
#
# 用法：
#   bash scripts/build-typst.sh          只编译产物比源文件旧的
#   bash scripts/build-typst.sh --force  全部重编译
#
# 没装 typst 时打印警告并 exit 0：发布链不该因为本机缺工具就断掉，
# 此时沿用仓库里已提交的旧 PDF。真正的编译失败才 exit 1。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

if ! command -v typst >/dev/null 2>&1; then
	echo "[typst] 警告：未找到 typst 命令，跳过编译，沿用已有的 PDF" >&2
	exit 0
fi

echo "[typst] $(typst --version)"

# 仓库自带的字体（Fira Code）。typost 默认只扫系统字体目录，
# 不把这里传进去就找不到 Fira Code，会静默回退到其它等宽字体。
FONT_ARGS=()
if [[ -d assets/fonts ]]; then
	FONT_ARGS=(--font-path assets/fonts)
	echo "[typst] 字体目录: assets/fonts"
else
	echo "[typst] 警告：缺少 assets/fonts，Fira Code 可能找不到" >&2
fi

count=0
skip=0
fail=0

# 收集声明了 typst 字段的文章配置（yaml / yml / json 都认）
while IFS= read -r cfg; do
	dir=$(dirname "$cfg")

	# json 配置：一行搞定，直接取 "typst": "x.typ"
	# yaml 配置：取 typst: 后面的值，容忍引号与行尾注释
	value=$(
		if [[ "$cfg" == *.json ]]; then
			sed -n 's/.*"typst"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$cfg"
		else
			sed -n 's/^[[:space:]]*typst[[:space:]]*:[[:space:]]*\(.*\)$/\1/p' "$cfg" \
				| sed -e 's/[[:space:]]*#.*$//' -e 's/^["'\'']//' -e 's/["'\'']$//'
		fi | head -n 1
	)

	[[ -n "$value" ]] || continue

	src="$dir/$value"
	pdf="${src%.typ}.pdf"

	if [[ ! -f "$src" ]]; then
		echo "[typst] 配置指向的源文件不存在: $src（来自 $cfg）" >&2
		fail=$((fail + 1))
		continue
	fi

	if [[ $FORCE -eq 0 && -f "$pdf" && "$pdf" -nt "$src" ]]; then
		echo "[typst] 跳过（已是最新）: $src"
		skip=$((skip + 1))
		continue
	fi

	echo "[typst] 编译: $src -> $pdf"
	if typst compile "${FONT_ARGS[@]}" "$src" "$pdf"; then
		count=$((count + 1))
	else
		echo "[typst] 编译失败: $src" >&2
		fail=$((fail + 1))
	fi
done < <(find book -type f \( -name 'config.yaml' -o -name 'config.yml' -o -name 'config.json' \) | sort)

if [[ $count -eq 0 && $skip -eq 0 && $fail -eq 0 ]]; then
	echo "[typst] book/ 下没有声明 typst 源文件，跳过"
fi

echo "[typst] 完成：编译 ${count} 个，跳过 ${skip} 个，失败 ${fail} 个"

[[ $fail -eq 0 ]] || exit 1
