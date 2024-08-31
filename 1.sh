# 函数 rsync dir 下面的所有文件夹
function rsync_dir {
	for dir in $(find $1 -mindepth 1 -maxdepth 1 -type d); do
		# echo "$dir"
		rsync -av "$dir" ./dist/
	done
}

rsync_dir "./assets/"
