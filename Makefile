composer.phar: tools/install-composer.sh
	tools/install-composer.sh

build/index.html: src/html/index.html
	cp src/html/index.html build/

build/bundle.js: src/js/*
	npx webpack --config webpack.js

build/xterm.css: node_modules/xterm/css/xterm.css
	cp node_modules/xterm/css/xterm.css build/

build/xterm.js: node_modules/xterm/lib/xterm.js
	cp node_modules/xterm/lib/xterm.js build/

build/.htaccess: src/conf/apache.htaccess
	cp src/conf/apache.htaccess build/.htaccess

.PHONY: api
api:
	cp src/api/api.php build/

.PHONY: lint-js
lint-js:
	npx eslint "src/js/**"

.PHONY: build
build: lint-js build/bundle.js build/index.html build/xterm.css build/xterm.js build/.htaccess api

.PHONY: start
start:
	-rm -fR $(PWD)/apache/modules
	ln -sf /usr/lib/apache2/modules $(PWD)/apache/
	SERVER_ROOT=$(PWD) /usr/sbin/apache2 -X -f $(PWD)/apache2.conf
