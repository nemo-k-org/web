<?php

namespace NemoK\Utils;

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

class Router {
    private $routes;
    private $logger;

    function __construct() {
        $this->routes = [];

        $this->logger = $logger = new Logger("Router");
        $this->logger->pushHandler(new StreamHandler(LOG_FILE, LOG_LEVEL));
    }

    function add($method, $routeRegexp, $parameter, $action) {
        array_push($this->routes,
            [
                'method'=>$method,
                'route'=>"#$routeRegexp#",
                'parameter'=>$parameter,
                'action'=>$action,
                'requireAuthorisation'=>false
            ]
        );
    }

    function addAuthorised($method, $routeRegexp, $parameter, $action) {
        array_push($this->routes,
            [
                'method'=>$method,
                'route'=>"#$routeRegexp#",
                'parameter'=>$parameter,
                'action'=>$action,
                'requireAuthorisation'=>true
            ]
        );
    }

    function route($method, $uri, $customerCode) {
        $customerId = null;
        if (!is_null($customerCode)) {
            $customers = new Data\Customers();
            $customerId = $customers->getCustomerId($customerCode);
        }

        foreach ($this->routes as $route) {
            $matchMethod = $route['method'] == $method;
            $matchRoute = preg_match($route['route'], $uri, $routeParams);

            if ($matchMethod and $matchRoute === 1) {
                if ($route['requireAuthorisation']) {
                    if (is_null($customerId)) {
                        $this->logger->debug('Authorisation missing', [$route]);
                        continue;
                    }
                    else {
                        $customers->updateLastAction($customerId);
                    }
                }

                $this->logger->debug('Route match', [$route]);

                return $this->callRoute($route, $routeParams, $customerId);
            }
        }

        $this->logger->debug('None of the routes match', [$method, $uri, $customerCode]);

        return [null, Http::STATUS_CODE_NOT_FOUND];
    }

    private function callRoute($route, $routeParams, $customerId) {
        if ($route['requireAuthorisation']) {
            if (is_null($route['parameter'])) {
                return $route['action']($routeParams, $customerId);
            }
            else {
                return $route['action']($routeParams, $customerId, $route['parameter']);
            }
        }
        else {
            if (is_null($route['parameter'])) {
                return $route['action']($routeParams);
            }
            else {
                return $route['action']($routeParams, $route['parameter']);
            }
        }

        return null;
    }
}

?>