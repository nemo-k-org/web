<?php

namespace NemoK\Utils;

class Http {
    const STATUS_CODE_OK = 200;
    const STATUS_CODE_UNAUTHORIZED = 401;
    const STATUS_CODE_NOT_FOUND = 404;
    const STATUS_CODE_ERROR_INTERNAL_SERVER_ERROR = 500;
    const STATUS_CODE_ERROR = 540;
    const STATUS_CODE_ERROR_MISSING_PARAMETERS = 550;
    const STATUS_CODE_ERROR_FAILED_FILE_UPLOAD = 551;
    const STATUS_CODE_ERROR_FIRMWARE_FILE_MISSING = 552;

    function getInputParameters() {
        $requestBody = file_get_contents('php://input');
        return json_decode($requestBody, true);
    }
}
?>
