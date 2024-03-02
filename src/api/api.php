<?php

namespace NemoK;

require_once("autoload.php");
require_once("local-settings.php");

header("Content-Type: application/json");

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

$logger = new Logger("API");
$logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));

$http = new Utils\Http();
$post = $http->getInputParameters();
$logger->debug('Post variables', [$post]);

$router = new Utils\Router();
$router->add('post', '/api/jobs', $post['jobParameters'], function($routeMatch, $jobParameters) {
    $jobs = new Jobs();
    return $jobs->add($jobParameters, $_SERVER['HTTP_USER_AGENT'], $_SERVER['REMOTE_ADDR']);
});

$method = strtolower($_SERVER['REQUEST_METHOD']);
$uri = strtolower($_SERVER['REQUEST_URI']);

[$response, $statusCode] = $router->route($method, $uri);

$logger->debug('Response object and status', [$response, $statusCode]);

print(json_encode($response));
http_response_code($statusCode);

?>
