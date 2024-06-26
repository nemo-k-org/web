composer.phar: tools/install-composer.sh
	tools/install-composer.sh
	touch composer.phar

phpab.phar: tools/install-phpab.sh
	tools/install-phpab.sh
	touch phpab.phar

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

build/.htaccess: src/conf/apache.htaccess
	cp src/conf/apache.htaccess build/.htaccess

.PHONY: build/vendor-local/autoload.php
build/vendor-local/autoload.php:
	./phpab.phar -o build/vendor-local/autoload.php build/vendor-local/

.PHONY: build-backend-composer
composer-install: composer.json composer.phar
	mkdir -p build/vendor/
	COMPOSER_VENDOR_DIR=build/vendor/ php composer.phar install

.PHONY: vendor-local-install
vendor-local-install:
	cp -r src/api/vendor-local/ build/

.PHONY: api
api: composer-install vendor-local-install build/vendor-local/autoload.php
	cp src/api/*.php build/

.PHONY: lint-js
lint-js:
	npx eslint "src/js/**"

.PHONY: build
build: lint-js build/bundle.js build/index.html build/index.css build/xterm.css build/xterm.js build/.htaccess api

.PHONY: start
start: stop
	-rm -fR $(PWD)/apache/modules
	ln -sf /usr/lib/apache2/modules $(PWD)/apache/
	SERVER_ROOT=$(PWD) /usr/sbin/apache2 -X -f $(PWD)/apache2.conf

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
