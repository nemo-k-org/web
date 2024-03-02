<?php

namespace NemoK\Utils;

class Http {
    const STATUS_CODE_OK = 200;
    const STATUS_CODE_ERROR = 540;
    const STATUS_CODE_ERROR_MISSING_PARAMETERS = 550;

    function getInputParameters() {
        $requestBody = file_get_contents('php://input');
        return json_decode($requestBody, true);
    }
}
?>
