#!/bin/sh

wget -O composer.phar https://getcomposer.org/download/2.7.1/composer.phar
chmod 755 composer.phar
sha256sum -c tools/composer.sha256sum
exit $?
