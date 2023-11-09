
markdown_style_files := $(find ./src/markdown-style/ -type f -name "*css")
dist/markdown.css: $(markdown_style_files)
	./node_modules/.bin/sass ./src/markdown-style/markdown.scss $@
