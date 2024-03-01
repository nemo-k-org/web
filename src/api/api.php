<?php

require_once("local-settings.php");
require_once("vendor/autoload.php");

use Doctrine\DBAL\DriverManager;

header("Content-Type: application/json");

$db = DriverManager::getConnection(DB_API);

$response = [
    [ 'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD']],
    [ 'REQUEST_URI' => $_SERVER['REQUEST_URI']],
];

echo(json_encode($response));

?>
