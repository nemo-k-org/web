# Nemo-K Web

The goal of the Nemo-K project is to give DIY people with little or no
programming skills and easy tools to create [SignalK](http://signalk.org/)
sensors.

This repository contains Nemo-K web interface. Currently it is a proof-of-concept
utilising [esptool-js](https://www.npmjs.com/package/esptool-js) to upload
`firmware.bin` which can be created using [the Box](https://github.com/nemo-k-org/the-box).

## Requirements (development)

* Python 3 for running development server
* NodeJS & npm

## Building and running

```
git clone git@github.com:nemo-k-org/web.git
cd web
npm install
make build
make test
make start
make stop
```
