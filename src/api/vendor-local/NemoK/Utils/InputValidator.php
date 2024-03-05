<?php

namespace NemoK\Utils;

class InputValidator {
    private $jobParameters;

    function __construct($jobParameters = null) {
        $this->jobParameters = $jobParameters;
    }

    function getValidatedJobParameters($jobParameters = null) {
        if (is_null($jobParameters)) {
            $jobParameters = $this->jobParameters;
        }

        $validatedParameters = [];

        // NB! There should be no integers among values, otherwise AWS Serialization will croak:
        // SerializationException (client): class com.amazon.coral.value.json.numbers.TruncatingBigNumber can not be converted to an String

        if ($jobParameters['nemok_sensor_test_http'] != '') {
            $validatedParameters['NEMOK_SENSOR_TEST_HTTP'] = '1';

            $validatedParameters['NEMOK_WIFI_SSID'] = $this->validateAlphanumeric($jobParameters['nemok_wifi_ssid'], 'SSID');
            $validatedParameters['NEMOK_WIFI_PASS'] = $this->validateAlphanumeric($jobParameters['nemok_wifi_pass'], 'WiFi password');
        }

        return $validatedParameters;
    }

    function validateAlphanumeric($str, $field=null) {
        if (preg_match('/[^\w\d\-_]/', $str)) {
            if (is_null($field)) {
                throw new \Exception('given value is not alphanumeric');
            }
            else {
                throw new \Exception('given value "'.$field.'" not alphanumeric');
            }
        }

        return $str;
    }
}

?>
