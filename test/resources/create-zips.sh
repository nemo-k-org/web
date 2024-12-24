#!/bin/sh

if [ ! -f ../../build/autoload.php ]; then
    echo "build/autoload.php is missing"
    exit 1
fi

if [ ! -f ../../build/local-settings.php ]; then
    echo "build/local-settings.php is missing"
    exit 1
fi

export NEMOK_ZIP_PASSWORD=`php -r 'include("../../build/autoload.php"); include("../../build/local-settings.php"); echo(NEMOK_ZIP_PASSWORD);'`

if [ -z $NEMOK_ZIP_PASSWORD ]; then
    echo "Could not read NEMOK_ZIP_PASSWORD from build/local-settings.php"
    exit 1
fi

rm nemo-k-firmware*.zip

echo "This is OK firmware binary" >firmware.bin
sha256sum firmware.bin >firmware.bin.sha256
7z a -tzip -mem=AES256 -p$NEMOK_ZIP_PASSWORD nemo-k-firmware-ok firmware.bin firmware.bin.sha256

7z a -tzip -mem=AES256 -pFoo$NEMOK_ZIP_PASSWORD nemo-k-firmware-wrongpassword firmware.bin firmware.bin.sha256
7z a -tzip -mem=AES256 nemo-k-firmware-nopassword firmware.bin firmware.bin.sha256

echo "This is firmware binary" >firmware.bin
sha256sum firmware.bin >firmware.bin.sha256
echo "It is changed after sha256 hash was calculated" >>firmware.bin
7z a -tzip -mem=AES256 -p$NEMOK_ZIP_PASSWORD nemo-k-firmware-tampered firmware.bin firmware.bin.sha256

echo "This does not contain sha256 hash file" >firmware.bin
7z a -tzip -mem=AES256 -p$NEMOK_ZIP_PASSWORD nemo-k-firmware-nohashfile firmware.bin

echo "This contains bad sha256 hash file" >firmware.bin
echo "This is a bad hash file" >firmware.bin.sha256
7z a -tzip -mem=AES256 -p$NEMOK_ZIP_PASSWORD nemo-k-firmware-badhashfile firmware.bin firmware.bin.sha256

echo "This file will be deleted later" >firmware.bin
sha256sum firmware.bin >firmware.bin.sha256
rm firmware.bin
7z a -tzip -mem=AES256 -p$NEMOK_ZIP_PASSWORD nemo-k-firmware-nobinfile firmware.bin.sha256

echo "This is not a zip file at all!" >nemo-k-firmware-nozip.zip

if [ -f firmware.bin ]; then
    rm firmware.bin
fi

if [ -f firmware.bin.sha256 ]; then
    rm firmware.bin.sha256
fi
