mp4s=$(find . -type d -name "*1080p*" -exec find {} -maxdepth 1 -type f -name "*.mp4" \;)
mkdir -p ../dist/video/
for mp4 in $mp4s; do
	cp $mp4 ../dist/video/
	echo "copy $mp4 done"
done
