#!/bin/bash
mkdir -p ../dist/video
for file in $(find . -maxdepth 5 -type f -name "*.mp4");
do
    echo $file
    cp "$file" ../dist/video/
done
