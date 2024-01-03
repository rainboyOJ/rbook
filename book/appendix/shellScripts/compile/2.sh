#!/bin/bash
target="1.out"
args="< in > 1.out"

echo ./"$target"
echo "$args"
./"$target" "$args"
