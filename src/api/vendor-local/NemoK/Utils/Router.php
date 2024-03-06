<?php

namespace NemoK\Utils;

class Router {
    private $routes;

    function __construct() {
        $this->routes = [];
    }

    function add($method, $routeRegexp, $parameter, $action) {
        array_push($this->routes,
            [
                'method'=>$method,
                'route'=>"#$routeRegexp#",
                'parameter'=>$parameter,
                'action'=>$action,
                'requireCustomer'=>false
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
                'requireCustomer'=>true
            ]
        );
    }

    function route($method, $uri, $customerCode) {
        $result = null;

        $customerId = null;
        if (!is_null($customerCode)) {
            $customers = new Data\Customers();
            $customerId = $customers->getCustomerId($customerCode);
        }

        foreach ($this->routes as $route) {
            $matchMethod = $route['method'] == $method;
            $matchRoute = preg_match($route['route'], $uri, $routeParams);

            if ($matchMethod and $matchRoute === 1) {
                if ($route['requireCustomer'] and is_null($customerId)) {
                    continue;
                }
                else {
                    $customers->updateLastAction($customerId);
                }

                if (is_null($route['parameter'])) {
                    $result = $route['action']($routeParams);
                }
                else {
                    $result = $route['action']($routeParams, $route['parameter']);
                }
            }
        }

        return $result;
    }
}

?>