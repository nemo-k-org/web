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

## Database

### Create database and users

When creating the development/production environment for the first time, you have to create
the Nemo-K database and two users, one for the API and one for schema updates.

```
CREATE DATABASE `nemok` CHARACTER SET = 'utf8' COLLATE='utf8_general_ci';
GRANT ALL PRIVILEGES ON nemok.* TO 'nemok_admin'@'localhost' IDENTIFIED BY 'nemok_admin_password' WITH GRANT OPTION;
GRANT SELECT ON nemok.* TO 'nemok_api'@'localhost' IDENTIFIED BY 'nemok_api_password';
GRANT INSERT ON nemok.jobs to 'nemok_api'@'localhost';
GRANT INSERT ON nemok.status to 'nemok_api'@'localhost';
GRANT INSERT ON nemok.userAgents to 'nemok_api'@'localhost';
```

### Create new migrations

Execute:

`$ ./vendor/bin/doctrine-migrations generate`

The script creates a new migration stub at `src/api/migrations/`. Edit.

### Deploy migrations

See status:

`$ ./vendor/bin/doctrine-migrations status`

Dry-run migrations

`$ ./vendor/bin/doctrine-migrations migrate --dry-run`

Deploy migrations:

`$ ./vendor/bin/doctrine-migrations migrate`
