#!/bin/bash

REMOTE_SERVER=$1
REMOTE_PATH=$2
REMOTE_DIR=$3

if [ -f build-temp.zip ]; then rm build-temp.zip; fi
cd build
if [ -L build ]; then rm build; fi
cp -r ../src/api/migrations/ .                                                         || { echo "Copying db migrations"; exit 1; }
zip -ry9q ../build-temp.zip .htaccess *                                                || { echo "Creating build-temp.zip"; exit 1; }
rm -fR migrations/                                                                     || { echo "Removing temporary db migrations"; exit 1; }
cd ..
zip build-temp.zip migrations.server migrations-db.server                              || { echo "Adding Doctrine configuration files"; exit 1; }
7z rn build-temp.zip migrations.server migrations.php                                  || { echo "Renaming migrations.server"; exit 1; }
7z rn build-temp.zip migrations-db.server migrations-db.php                            || { echo "Renaming migrations-db.server"; exit 1; }

ssh ${REMOTE_SERVER} rm -fR ${REMOTE_PATH}/${REMOTE_DIR}.new/
ssh ${REMOTE_SERVER} mkdir -p ${REMOTE_PATH}/${REMOTE_DIR}.new/cgi-bin/                || { echo "Creating new remote directory ${REMOTE_DIR}.new/cgi-bin/ failed"; exit 1; }
scp build-temp.zip ${REMOTE_SERVER}:${REMOTE_PATH}                                     || { echo "Copying build-temp.zip to remote directory failed"; exit 1; }
ssh ${REMOTE_SERVER} unzip -q ${REMOTE_PATH}/build-temp.zip -d ${REMOTE_PATH}/${REMOTE_DIR}.new/          || { echo "Unzipping build-temp.zip"; exit 1; }
ssh ${REMOTE_SERVER} rm ${REMOTE_PATH}/build-temp.zip
rm build-temp.zip
ssh ${REMOTE_SERVER} cp ${REMOTE_PATH}/${REMOTE_DIR}/local-settings.php ${REMOTE_PATH}/${REMOTE_DIR}.new/ || { echo "Copying local-settings.php failed"; exit 1; }
ssh ${REMOTE_SERVER} rm -fR ${REMOTE_PATH}/${REMOTE_DIR}.old/
ssh ${REMOTE_SERVER} mv ${REMOTE_PATH}/${REMOTE_DIR}/ ${REMOTE_PATH}/${REMOTE_DIR}.old/   || { echo "Moving remote ${REMOTE_DIR}/ to ${REMOTE_DIR}.old/ failed"; exit 1; }
ssh ${REMOTE_SERVER} mv ${REMOTE_PATH}/${REMOTE_DIR}.new/ ${REMOTE_PATH}/${REMOTE_DIR}    || { echo "Moving remote ${REMOTE_DIR}.new/ to ${REMOTE_DIR}/ failed"; exit 1; }
ssh ${REMOTE_SERVER} nemok.org/vendor/bin/doctrine-migrations migrate --no-interaction \
    --configuration nemok.org/migrations.php \
    --db-configuration nemok.org/migrations-db.php                                     || { echo "Database migration"; exit 1; }
ssh ${REMOTE_SERVER} rm -fR ${REMOTE_PATH}/${REMOTE_DIR}/migrations/                   || { echo "Remove migration scripts"; exit 1; }
ssh ${REMOTE_SERVER} rm ${REMOTE_PATH}/${REMOTE_DIR}/migrations.php                    || { echo "Remove migrations.php"; exit 1; }
ssh ${REMOTE_SERVER} rm ${REMOTE_PATH}/${REMOTE_DIR}/migrations-db.php                 || { echo "Remove migrations-db.php"; exit 1; }
