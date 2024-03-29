# Nemo-K Web

The goal of the Nemo-K project is to give DIY people with little or no
programming skills and easy tools to create [SignalK](http://signalk.org/)
sensors.

This repository contains Nemo-K web interface. Currently it is a proof-of-concept
utilising [esptool-js](https://www.npmjs.com/package/esptool-js) to upload
`firmware.bin` which can be created using [the Box](https://github.com/nemo-k-org/the-box).

## Requirements (development)

* PHP 8.1 (`apt install php8.1-cli php8.1-mysql php8.1-zip`)
* MariaDB (`apt install mariadb-server-10.6`)
* Apache 2 (`apt install apache2-bin`)
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
GRANT UPDATE ON nemok.customers to 'nemok_api'@'localhost';
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

## CI (AWS CodeBuild)

The current version submits jobs AWS CodeBuild where the firmware is built with Nemo-K
the-box.

To submit jobs you need to give proper AWS credentials to your local profile
`NemoK`. If this profile name is used no changes to `src/api/local-settings.php`
are needed.

## Customers

Customers can be added directly to the database:

``INSERT INTO `customers` SET `customerCode`=UUID(), `email`='user@email', `added`=NOW();``

* Currently email is recorded only for the reference
* Starting a new job requires an existing Customer Code so this should be given to the customer

## API

### POST `/api/jobs`

Submit a new firmware compilation job.
* The `customerCode` must be a valid customer in database table `customers`.
* The `jobParameters` must be valid set of parameters. See `src/api/vendor-local/NemoK/Utils/InputValidator.php`
  for details.

`curl -X POST -d '{"customerCode":"valid-customer-code","jobParameters":{"ssid":"foo","password":"bar"}}' http://localhost:8080/api/jobs`

Return values:
* a new job id as JSON-encoded body text
* 200 - success
* 404 - missing authorisation (`customerCode`)
* 550 - missing job parameters (`jobParameters`)

### POST `/api/jobs/[jobId]/firmware`

Submit/update a new firmware binary for the job `jobId`.
* The `jobId` must be a valid job.
* The content of the zip must be valid, see `test/resources/create-zips.sh` for examples.

`curl -X POST -F "firmware=@firmware.zip" http://localhost:8080/api/jobs/[jobId]/firmware`

Return values:
* 200 - success
* 404 - missing jobId (`jobId`)
* 551 - zip file fails validity check (`firmware`)

## GET `/api/jobs/[jobId]/status`

Query job status.
* The `customerCode` must be an owner of given job `jobId`.

`curl -X GET -d '{"customerCode":"valid-customer-code"}' http://localhost:8080/api/jobs/[jobId]/status`

Return values:
* job status as JSON-encoded body text
* 200 - success
* 401 - given customer does not own given job
* 404 - missing authorisation (`customerCode`)

## Tests

The tests read database connection parameters from `build/local-settings.php`.

To run backend without making calls to AWS:

`NEMOK_AWS_DRYRUN=1 make start`

Both of these can be achieved simply by saying

`make test`
