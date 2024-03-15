#!/bin/sh

rm nemo-k-firmware*.zip

echo "This is OK firmware binary" >firmware.bin
sha256sum firmware.bin >firmware.bin.sha256
zip nemo-k-firmware-ok firmware.bin firmware.bin.sha256

echo "This is firmware binary" >firmware.bin
sha256sum firmware.bin >firmware.bin.sha256
echo "It is changed after sha256 hash was calculated" >>firmware.bin
zip nemo-k-firmware-tampered firmware.bin firmware.bin.sha256

echo "This does not contain sha256 hash file" >firmware.bin
zip nemo-k-firmware-nohashfile firmware.bin

echo "This contains bad sha256 hash file" >firmware.bin
echo "This is a bad hash file" >firmware.bin.sha256
zip nemo-k-firmware-badhashfile firmware.bin firmware.bin.sha256

echo "This file will be deleted later" >firmware.bin
sha256sum firmware.bin >firmware.bin.sha256
rm firmware.bin
zip nemo-k-firmware-nobinfile firmware.bin.sha256

echo "This is not a zip file at all!" >nemo-k-firmware-nozip.zip

if [ -f firmware.bin ]; then
    rm firmware.bin
fi

if [ -f firmware.bin.sha256 ]; then
    rm firmware.bin.sha256
fi
