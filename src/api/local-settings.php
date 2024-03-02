<?php

// This is the settings file to be used in development

define('DB_API', [
    'dbname' => 'nemok',
    'user' => 'nemok_api',
    'password' => 'nemok_api_password',
    'host' => 'localhost',
    'driver' => 'pdo_mysql',
    'charset' => 'utf8',
]);

define('DB_ADMIN', [
    'dbname' => 'nemok',
    'user' => 'nemok_admin',
    'password' => 'nemok_admin_password',
    'host' => 'localhost',
    'driver' => 'pdo_mysql',
    'charset' => 'utf8',
]);

define('LOG_LEVEL', \Monolog\Logger::DEBUG);

if (getenv('NEMOK_LOG_FILE')) {
    define('LOG_FILE', getenv('NEMOK_LOG_FILE'));
}
else {
    define('LOG_FILE', sys_get_temp_dir().'/nemok.log');
}

?>