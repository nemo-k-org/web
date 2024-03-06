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
                if ($route['requireAuthorisation'] and is_null($customerId)) {
                    continue;
                }
                else {
                    $customers->updateLastAction($customerId);
                }

                $result = $this->callRoute($route, $routeParams, $customerId);

                break;
            }
        }

        return $result;
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