build/index.html: src/html/index.html
	cp src/html/index.html build/

build/index.css: src/html/index.css
	cp src/html/index.css build/

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
build: lint-js build/bundle.js build/index.html build/index.css build/xterm.css build/xterm.js

.PHONY: start
start:
	cd build; python3 -m http.server

start-test: stop
	-rm -fR $(PWD)/apache/modules
	ln -sf /usr/lib/apache2/modules $(PWD)/apache/
	SERVER_ROOT=$(PWD) NEMOK_AWS_DRYRUN=1 /usr/sbin/apache2 -f $(PWD)/apache2.conf

.PHONY: stop
stop:
	if [ -f apache/httpd.pid ]; then kill -TERM `cat apache/httpd.pid`; sleep 2; fi

.PHONY: test
test: stop start-test
	npx playwright test --config=test/playwright.api.config.ts
	if [ -f apache/httpd.pid ]; then kill -TERM `cat apache/httpd.pid`; fi

.PHONY: publish
publish:
	./publish.sh nemok.org /home/qogmdthz/ nemok.org
