videos=$(find . -type f -name "*.mp4" | grep -v partial_movie | grep 1080p)
mkdir -p dist/video
for vidoe in "$videos"; do
	echo $vidoe
	rsync $vidoe ./dist/video/
done
