# Nemo-K Web

The goal of the Nemo-K project is to give DIY people with little or no
programming skills and easy tools to create [SignalK](http://signalk.org/)
sensors.

This repository contains Nemo-K web interface. Currently it is a proof-of-concept
utilising [esptool-js](https://www.npmjs.com/package/esptool-js) to upload
`firmware.bin` which can be created using [the Box](https://github.com/nemo-k-org/the-box).

## Building and running

```
git clone git@github.com:nemo-k-org/web.git
cd web
npm install
make build
```

Start your favourite [one-line web server](https://gist.github.com/willurd/5720255)
to serve files at `build/`

```
cd build/ && python3 -m http.server 8080
```
