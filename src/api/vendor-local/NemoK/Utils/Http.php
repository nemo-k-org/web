<?php

namespace NemoK\Utils;

class Http {
    const STATUS_CODE_OK = 200;
    const STATUS_CODE_ERROR = 540;
    const STATUS_CODE_ERROR_MISSING_PARAMETERS = 550;

    function postDecodeJson($post) {
        $decoded = [];

        foreach ($post as $thisKey => $thisValue) {
            $decoded[$thisKey] = json_decode($thisValue, true);
        }

        return $decoded;
    }
}
?>
