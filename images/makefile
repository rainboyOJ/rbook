# author:rainboy
# 使用
# make

# 列出所有的asy文件
asys:= $(shell find . -type f  -name "*.asy" -printf "%P\n" )
# $(info $(asys))
objects := $(patsubst %.asy,%.svg,$(asys))
install_objects := $(patsubst %.asy,../dist/images/%.svg,$(asys))
# $(info $(objects))
# $(info $(install_objects))

all: $(objects)
	@echo "all done!"

install: $(install_objects)
	@echo "install all"


%.svg : %.asy
	mkdir -p $(shell dirname $@)
	asy -f svg -o $@ $<

../dist/images/%.svg : %.asy
	mkdir -p $(shell dirname $@)
	asy -f svg -o $@ $<

# 这里是伪目标，防止 Makefile 误将文件名当作目标名
.PHONY: all install
