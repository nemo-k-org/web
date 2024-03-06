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

$inputValidator = new Utils\InputValidator();
$customerCode = null;
if (@$post['customerCode']) {
    try {
        $customerCode = $inputValidator->validateUuid($post['customerCode']);
    } catch (\Exception $e) {
        $logger->debug("Given customerCode is not valid UUID", [$post['customerCode']]);
    }
}

try {
    $jobParameters = $inputValidator->getValidatedJobParameters(@$post['jobParameters']);
} catch (\Exception $e) {
    print(json_encode($e->getMessage()));
    http_response_code($http::STATUS_CODE_ERROR_MISSING_PARAMETERS);
    exit(0);
}

$router = new Utils\Router();

$router->addAuthorised('post', '/api/jobs$', $jobParameters, function($routeMatch, $jobParameters) {
    $jobs = new Jobs();
    return $jobs->add($jobParameters, $_SERVER['HTTP_USER_AGENT'], $_SERVER['REMOTE_ADDR']);
});

$router->add('post', '/api/jobs/([\w\d\-]+?)/firmware$', null, function($routeMatch) {
    $jobs = new Jobs();
    return $jobs->updateFirmware($routeMatch[1], @$_FILES['firmware']['tmp_name']);
});

$method = strtolower($_SERVER['REQUEST_METHOD']);
$uri = strtolower($_SERVER['REQUEST_URI']);

[$response, $statusCode] = $router->route($method, $uri, $customerCode);

$logger->debug('Response object and status', [$response, $statusCode]);

print(json_encode($response));
http_response_code($statusCode);

?>
