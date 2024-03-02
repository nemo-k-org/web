#!/bin/sh

wget -O phpab.phar https://github.com/theseer/Autoload/releases/download/1.27.2/phpab-1.27.2.phar
chmod 755 phpab.phar
sha256sum -c tools/phpab.sha256sum
exit $?
