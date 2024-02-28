<?php
header("Content-Type: application/json");

$response = [
    [ 'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD']],
    [ 'REQUEST_URI' => $_SERVER['REQUEST_URI']],
];

echo(json_encode($response));

?>
