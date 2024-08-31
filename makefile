
markdown_style_files:=$(shell find src/markdown-style/ -type f -name "*css")

all: dist/prism-theme dist/markdown.css
	@echo done

dist/prism-theme: ./src/prism-theme/
	cp -r ./src/prism-theme dist/

dist/markdown.css: $(markdown_style_files)
	./node_modules/.bin/sass ./src/markdown-style/markdown.scss $@
