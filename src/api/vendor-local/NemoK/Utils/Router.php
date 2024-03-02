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
                'action'=>$action
            ]
        );
    }

    function route($method, $uri) {
        $result = null;

        foreach ($this->routes as $route) {
            $matchMethod = $route['method'] == $method;
            $matchRoute = preg_match($route['route'], $uri, $routeParams);

            if ($matchMethod and $matchRoute === 1) {
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