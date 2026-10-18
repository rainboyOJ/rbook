Compiler=asy
SRC=$(wildcard *.asy)
TARGET=$(patsubst %.asy,%.svg,$(SRC))

all: $(TARGET)
	@echo done

%.svg : %.asy
	$(Compiler) -f svg $<
