CXX=asy

SRC=$(wildcard *.asy)
TARGET=$(patsubst %.asy,%.svg,$(SRC))

all: $(TARGET)
	@echo done

%.svg : %.asy
	$(CXX) -globalwrite -o ../../$<

clean:
	rm -rf $(TARGET)
