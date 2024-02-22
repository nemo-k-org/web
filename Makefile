build/index.html: src/html/index.html
	cp src/html/index.html build/

build/bundle.js: src/js/*
	npx webpack --config webpack.js

build/xterm.css: node_modules/xterm/css/xterm.css
	cp node_modules/xterm/css/xterm.css build/

build/xterm.js: node_modules/xterm/lib/xterm.js
	cp node_modules/xterm/lib/xterm.js build/

.PHONY: lint-js
lint-js:
	npx eslint "src/js/**"

.PHONY: build
build: lint-js build/bundle.js build/index.html build/xterm.css build/xterm.js
