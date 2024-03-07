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

define('AWS_CODEBUILD', [
    'credentialsPath' => getenv('HOME').'/.aws/credentials',
    'profile' => 'NemoK',
    'version' => '2016-10-06',
    'region' => 'eu-central-1',
    'codeBuildProjectname' => 'Nemo-K-firmware',
]);

  define('LOG_LEVEL', \Monolog\Logger::DEBUG);

if (getenv('NEMOK_LOG_FILE')) {
    define('LOG_FILE', getenv('NEMOK_LOG_FILE'));
}
else {
    define('LOG_FILE', sys_get_temp_dir().'/nemok.log');
}

if (getenv('NEMOK_FIRMWARE_PATH')) {
    define('FIRMWARE_PATH', getenv('NEMOK_FIRMWARE_PATH'));
}
else {
    define('FIRMWARE_PATH', sys_get_temp_dir().'/nemok-firmwares');
}

if (getenv('NEMOK_ROOT_URL')) {
    define('ROOT_URL', getenv('NEMOK_ROOT_URL'));
}
else {
    define('ROOT_URL',@$_SERVER['REQUEST_SCHEME'].'://'.@$_SERVER['HTTP_HOST']);
}

?>
